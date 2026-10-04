const DEFAULT_MODEL = 'gpt-4o-mini';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getApiUrl = () => {
  const customBase = (process.env.OPENAI_BASE_URL || process.env.OPENAI_API_BASE || '').trim();
  if (customBase) {
    return customBase.endsWith('/chat/completions')
      ? customBase
      : `${customBase.replace(/\/+$/, '')}/chat/completions`;
  }
  return 'https://api.openai.com/v1/chat/completions';
};

const parseRetryAfterMs = (value) => {
  if (!value) return null;

  const seconds = Number.parseFloat(value);
  if (Number.isFinite(seconds) && seconds >= 0) {
    return Math.round(seconds * 1000);
  }

  const dateMs = Date.parse(value);
  if (Number.isNaN(dateMs)) return null;

  const delta = dateMs - Date.now();
  return delta > 0 ? delta : null;
};

const parseOpenAIErrorMessage = (rawText, status) => {
  if (!rawText) return `API request failed with status ${status}`;

  try {
    const parsed = JSON.parse(rawText);
    return parsed?.error?.message || rawText;
  } catch {
    return rawText;
  }
};

const getOutputText = (data) => {
  if (typeof data?.choices?.[0]?.message?.content === 'string') {
    return data.choices[0].message.content;
  }
  if (typeof data?.output_text === 'string') {
    return data.output_text;
  }

  const parts = [];
  for (const item of data?.output || []) {
    for (const content of item?.content || []) {
      if (typeof content?.text === 'string') parts.push(content.text);
      if (typeof content?.json === 'object') return JSON.stringify(content.json);
    }
  }
  return parts.join('\n').trim();
};

const parseJsonOutput = (data) => {
  const outputText = getOutputText(data);
  if (!outputText) {
    throw new Error('The AI response did not include output content.');
  }

  const cleanedText = outputText
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim();

  try {
    return JSON.parse(cleanedText);
  } catch (error) {
    const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch {
        throw error;
      }
    }
    throw error;
  }
};

const normalizeModelName = (modelName) => {
  const name = (modelName || '').trim();
  if (name === 'gpt-4.1-mini' || !name) {
    return DEFAULT_MODEL;
  }
  return name;
};

const callOpenAIJson = async ({ system, user, schema, schemaName, maxOutputTokens = 2400 }) => {
  const apiKey = (process.env.OPENAI_API_KEY || '').trim();
  if (!apiKey) {
    const error = new Error('OPENAI_API_KEY is not configured.');
    error.statusCode = 503;
    throw error;
  }

  const apiUrl = getApiUrl();
  const rawConfiguredModel = (process.env.OPENAI_MODEL || DEFAULT_MODEL).trim();
  const configuredModel = normalizeModelName(rawConfiguredModel);

  const fallbackModels = `${process.env.OPENAI_MODEL_FALLBACKS || ''}`
    .split(',')
    .map((item) => normalizeModelName(item))
    .filter(Boolean)
    .filter((item) => item !== configuredModel);

  const isCustomBase = Boolean(process.env.OPENAI_BASE_URL || process.env.OPENAI_API_BASE);
  const modelsToTry = isCustomBase
    ? [configuredModel, ...fallbackModels]
    : [...new Set([configuredModel, ...fallbackModels, 'gpt-4o-mini', 'gpt-4o'])];

  let lastError = null;

  for (const model of modelsToTry) {
    const maxRetries = Number.parseInt(process.env.OPENAI_RETRY_MAX || '2', 10);
    let attempt = 0;

    while (attempt <= maxRetries) {
      let response;
      try {
        const promptSystem = `${system}\n\nIMPORTANT: Respond ONLY with valid JSON matching the schema for ${schemaName}. Do not include markdown code block syntax or extra text outside JSON.`;
        
        response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model,
            messages: [
              {
                role: 'system',
                content: promptSystem,
              },
              {
                role: 'user',
                content: user,
              },
            ],
            response_format: {
              type: 'json_object',
            },
            max_tokens: maxOutputTokens,
          }),
        });
      } catch (fetchError) {
        const error = new Error(
          fetchError?.cause?.message
            ? `AI network error: ${fetchError.cause.message}`
            : `AI network error: ${fetchError.message || 'fetch failed'}`
        );
        error.statusCode = 503;
        lastError = error;
        break;
      }

      if (response.ok) {
        return parseJsonOutput(await response.json());
      }

      const text = await response.text().catch(() => '');
      const message = parseOpenAIErrorMessage(text, response.status);
      const error = new Error(message);
      error.statusCode = response.status;
      lastError = error;

      if (response.status === 401 || (response.status === 429 && message.includes('quota'))) {
        break;
      }

      const retryableStatus = response.status === 429 || response.status >= 500;
      if (!retryableStatus || attempt >= maxRetries) {
        break;
      }

      const retryAfterHeader = response.headers.get('retry-after');
      const retryAfterMs = parseRetryAfterMs(retryAfterHeader);
      const backoffMs = retryAfterMs || (800 * (attempt + 1));
      await sleep(backoffMs);
      attempt += 1;
    }

    if (lastError && (lastError.statusCode === 401 || (lastError.statusCode === 429 && lastError.message.includes('quota')))) {
      break;
    }
  }

  throw lastError || new Error('AI request failed.');
};

module.exports = { callOpenAIJson, DEFAULT_MODEL };
