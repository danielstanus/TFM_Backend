const dotenv = require("dotenv");
const { OpenAIClient, AzureKeyCredential } = require("@azure/openai");
const axios = require('axios');

dotenv.config();

function generarIdSimple() {
  return Math.random().toString(36).substr(2, 9);
}

let client;

const inicializarAI = () => {
  if (process.env.USE_LOCAL_MODEL === 'true') {
    console.log("Usando modelo GPT-2 local...");
    // No necesitamos inicializar un cliente para el modelo local
  } else {
    if (!process.env.AZURE_OPENAI_KEY || !process.env.AZURE_OPENAI_ENDPOINT) {
      throw new Error("AZURE_OPENAI_KEY o AZURE_OPENAI_ENDPOINT no están definidos en el archivo .env");
    }
    console.log("Inicializando cliente de Azure OpenAI...");
    console.log("Endpoint:", process.env.AZURE_OPENAI_ENDPOINT);
    console.log("Key:", process.env.AZURE_OPENAI_KEY.substring(0, 10) + "...");

    try {
      client = new OpenAIClient(
        process.env.AZURE_OPENAI_ENDPOINT,
        new AzureKeyCredential(process.env.AZURE_OPENAI_KEY)
      );
      console.log("Cliente de Azure OpenAI inicializado correctamente");
    } catch (error) {
      console.error("Error al inicializar el cliente de Azure OpenAI:", error);
      throw error;
    }
  }
};

try {
  inicializarAI();
} catch (error) {
  console.error("Error al inicializar el cliente de AI:", error);
}

const analizarRespuesta = (bloqueTexto) => {
  console.log("\n Analizando respuesta:", bloqueTexto);

  const lineas = bloqueTexto.split('\n').filter(linea => linea.trim() !== '');

  if (lineas.length < 6) {
    console.error("Formato inesperado en el bloque de respuesta:", bloqueTexto);
    return null;
  }

  const pregunta = lineas[0].replace(/^Pregunta \d+:/, '').trim();

  let opcionesInicio;
  if (lineas.some(linea => linea.trim().startsWith('Opciones:'))) {
    opcionesInicio = lineas.findIndex(linea => linea.trim().startsWith('Opciones:')) + 1;
  } else {
    opcionesInicio = lineas.findIndex(linea => linea.trim().startsWith('Opción A)') || linea.trim().startsWith('A)'));
  }

  if (opcionesInicio === -1 || opcionesInicio + 3 >= lineas.length) {
    console.error("Opciones no encontradas o insuficientes:", lineas);
    return null;
  }

  const opcionesTexto = lineas.slice(opcionesInicio, opcionesInicio + 4).map(linea => linea.trim());

  const respuestaIndex = lineas.findIndex(linea => linea.trim().startsWith('Respuesta:'));
  if (respuestaIndex === -1) {
    console.error("Respuesta no encontrada:", lineas);
    return null;
  }

  const respuestaTexto = lineas[respuestaIndex].replace('Respuesta:', '').trim();

  if (opcionesTexto.length !== 4) {
    console.error("Número incorrecto de opciones:", opcionesTexto);
    return null;
  }

  const letraRespuestaCorrecta = respuestaTexto.charAt(0);
  const indiceRespuestaCorrecta = letraRespuestaCorrecta.charCodeAt(0) - 65;

  return {
    pregunta,
    opciones: opcionesTexto,
    respuestaCorrecta: opcionesTexto[indiceRespuestaCorrecta]
  };
};

const generateQuestionsFromAI = async (texto, numQuestions) => {
  try {
    console.log(`Iniciando generateQuestionsFromAI con texto: "${texto}" y numQuestions: ${numQuestions}`);

    const questionPhrase = numQuestions === 1 ? "una pregunta" : `${numQuestions} preguntas`;
    const questionsFormat = `Genera exactamente ${questionPhrase} de opción múltiple basada${numQuestions === 1 ? '' : 's'} en este texto: "${texto}" en Español Castellano.
    ${numQuestions === 1 ? 'Proporciona la pregunta' : 'Para cada pregunta, proporciona la pregunta'}, 4 opciones (etiquetadas A, B, C, D) y la respuesta correcta.
    Formatea ${numQuestions === 1 ? 'la pregunta' : 'cada pregunta'} de la siguiente manera:
    Pregunta ${numQuestions === 1 ? '1' : '[numero de pregunta]'}: [Tu pregunta aquí]
    
    Opciones:
    A) [Opción A]
    B) [Opción B]
    C) [Opción C]
    D) [Opción D]
    
    Respuesta: [Letra de la respuesta correcta]
    
    Asegúrate de que las opciones no tengan espacios entre ellas y que no tengan guiones ni puntos al final de las opciones.
    ${numQuestions === 1 ? '' : 'Proporciona exactamente ' + numQuestions + ' preguntas, ni más ni menos.'}`;

    let response;

    if (process.env.USE_LOCAL_MODEL === 'true') {
      // Usar el modelo GPT-2 local
      const localEndpoint = "http://localhost:8005/chat";

      const requestBody = {
        question: questionsFormat
      };


      const now = new Date();
      const horaActual = now.toLocaleTimeString(); // Formatea la hora según la configuración local
      console.log(`${horaActual} - Enviando solicitud al modelo llama3 local`);

      response = await axios.post(localEndpoint, requestBody);

      // Asumiendo que el modelo llama3 local devuelve directamente el texto generado
      const generatedText = response.data.answer;

      const now2 = new Date();
      const horaActual2 = now2.toLocaleTimeString(); // Formatea la hora según la configuración local
      console.log(`${horaActual2} - Respuesta recibida del modelo llama3 local  \n "${generatedText}"`);

      const bloquesPregunta = generatedText.split(/(?=Pregunta \d+:)/).filter(bloque => bloque.trim() !== '');

      const preguntas = bloquesPregunta
        .map(bloque => analizarRespuesta(bloque))
        .filter(q => q !== null);

      return preguntas.map((q, index) => ({
        id: generarIdSimple(),
        question: `${index + 1}. ${q.pregunta}`,
        options: q.opciones,
        correctAnswer: q.respuestaCorrecta
      }));

    } else {
      // Usar Azure OpenAI
      const apiKey = process.env.AZURE_OPENAI_KEY;
      const endpoint = process.env.AZURE_OPENAI_ENDPOINT_URL;
      const deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT_NAME;

      if (!apiKey || !endpoint || !deploymentName) {
        throw new Error("Faltan variables de entorno necesarias para Azure OpenAI");
      }

      const requestBody = {
        messages: [
          { role: "system", content: "Eres un asistente útil que genera preguntas de opción múltiple." },
          { role: "user", content: questionsFormat }
        ],
        max_tokens: 1000,
        temperature: 0.7,
        top_p: 1
      };

      console.log("Enviando solicitud a Azure OpenAI...");
      console.log("questionsFormat:", questionsFormat);

      response = await axios.post(endpoint, requestBody, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        }
      });

      console.log("Respuesta recibida de Azure OpenAI:");
      console.log(response.data.choices[0].message.content);

      const respuestaCompleta = response.data.choices[0].message.content;
      const bloquesPregunta = respuestaCompleta.split(/(?=Pregunta \d+:)/).filter(bloque => bloque.trim() !== '');

      const preguntas = bloquesPregunta
        .map(bloque => analizarRespuesta(bloque))
        .filter(q => q !== null);

      return preguntas.map((q, index) => ({
        id: generarIdSimple(),
        question: `${index + 1}. ${q.pregunta}`,
        options: q.opciones,
        correctAnswer: q.respuestaCorrecta
      }));
    }

  } catch (error) {
    console.error("Error detallado en generarPreguntasDesdeIA:", error);
    if (error.response) {
      console.error("Respuesta de error:", error.response.data);
      console.error("Estado de error:", error.response.status);
      console.error("Encabezados de error:", error.response.headers);
    } else {
      console.error("Error:", error.message);
    }
    throw error;
  }
};

module.exports = {
  generateQuestionsFromAI,
};

