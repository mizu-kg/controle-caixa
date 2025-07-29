import { db } from '../../../src/js/firebase/config.js';
import { 
  collection, 
  addDoc, 
  serverTimestamp,
  writeBatch
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Configuration constants
const LOG_CONFIG = {
  COLLECTION_NAME: "logs_auditoria",
  MAX_RETRIES: 3,
  BATCH_SIZE: 50,
  LOG_LEVELS: {
    INFO: 'info',
    WARN: 'warn',
    ERROR: 'error',
    DEBUG: 'debug'
  }
};

// Log queue for batch processing
let logQueue = [];
let processing = false;

/**
 * Formats log details into a consistent structure
 */
const formatLogDetails = (details) => {
  if (typeof details === 'string') {
    return { message: details };
  }
  if (details instanceof Error) {
    return {
      message: details.message,
      stack: details.stack,
      name: details.name
    };
  }
  return details;
};

/**
 * Processes the log queue in batches
 */
const processQueue = async () => {
  if (processing || logQueue.length === 0) return;
  
  processing = true;
  const batch = writeBatch(db);
  const logsToProcess = logQueue.splice(0, LOG_CONFIG.BATCH_SIZE);

  try {
    logsToProcess.forEach(log => {
      const docRef = doc(collection(db, LOG_CONFIG.COLLECTION_NAME));
      batch.set(docRef, log);
    });

    await batch.commit();
    console.debug(`[LOGGER] Processed ${logsToProcess.length} logs`);
  } catch (error) {
    console.error("[LOGGER] Batch processing failed:", error);
    // Requeue failed logs
    logQueue.unshift(...logsToProcess);
  } finally {
    processing = false;
    
    // Process remaining logs if any
    if (logQueue.length > 0) {
      setTimeout(processQueue, 100);
    }
  }
};

/**
 * Main logging function with retry mechanism
 */
export const registrarLog = async (
  acao, 
  resultado = LOG_CONFIG.LOG_LEVELS.INFO, 
  detalhes = {}, 
  userId = null,
  retryCount = 0
) => {
  const logEntry = {
    userId,
    acao,
    resultado: LOG_CONFIG.LOG_LEVELS[resultado] || resultado,
    data: serverTimestamp(),
    detalhes: formatLogDetails(detalhes),
    environment: process.env.NODE_ENV || 'development',
    clientTimestamp: new Date().toISOString()
  };

  // Add to queue for batch processing
  logQueue.push(logEntry);
  
  // Immediate processing for error logs
  if (resultado === LOG_CONFIG.LOG_LEVELS.ERROR) {
    await processQueue();
  } else {
    // Defer processing for non-critical logs
    if (logQueue.length >= LOG_CONFIG.BATCH_SIZE) {
      await processQueue();
    }
  }

  // Console output based on log level
  const consoleMethod = {
    [LOG_CONFIG.LOG_LEVELS.ERROR]: console.error,
    [LOG_CONFIG.LOG_LEVELS.WARN]: console.warn,
    [LOG_CONFIG.LOG_LEVELS.DEBUG]: console.debug
  }[logEntry.resultado] || console.log;

  consoleMethod(`[${logEntry.resultado.toUpperCase()}] ${acao}`, detalhes);
};

/**
 * Critical error logger with additional context
 */
export const registrarErroCritico = async (error, context = {}) => {
  await registrarLog(
    'ERRO_CRITICO', 
    LOG_CONFIG.LOG_LEVELS.ERROR,
    {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      context
    }
  );
};

/**
 * Performance monitoring helper
 */
export const registrarMetrica = async (metricName, duration, metadata = {}) => {
  await registrarLog(
    `METRICA_${metricName}`,
    LOG_CONFIG.LOG_LEVELS.INFO,
    {
      duration,
      ...metadata
    }
  );
};

// Process any remaining logs on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    if (logQueue.length > 0) {
      navigator.sendBeacon('/api/logs', JSON.stringify(logQueue));
    }
  });
}

console.debug("[LOGGER] Logger module initialized");