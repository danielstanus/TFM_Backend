require("dotenv").config();
const { OpenAIClient, AzureKeyCredential } = require("@azure/openai");

const axios = require('axios');

function generarIdSimple() {
  return Math.random().toString(36).substr(2, 9);
}

let client;

const inicializarAzureAI = () => {
  if (!process.env.AZURE_OPENAI_KEY || !process.env.AZURE_OPENAI_ENDPOINT) {
    throw new Error("AZURE_OPENAI_KEY o AZURE_OPENAI_ENDPOINT no están definidos en el archivo .env");
  }
  console.log("Inicializando cliente de Azure OpenAI...");
  console.log("Endpoint:", process.env.AZURE_OPENAI_ENDPOINT);
  console.log("Key:", process.env.AZURE_OPENAI_KEY.substring(0, 5) + "...");  // Solo muestra los primeros 5 caracteres por seguridad
  
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
};

try {
  inicializarAzureAI();
} catch (error) {
  console.error("Error al inicializar el cliente de Azure OpenAI:", error);
}

const analizarRespuesta2 = (bloqueTexto) => {
  console.log("Analizando respuesta:", bloqueTexto);

  const lineas = bloqueTexto.split('\n').filter(linea => linea.trim() !== '');
  
  if (lineas.length < 3) {
    console.error("Formato inesperado en el bloque de respuesta:", bloqueTexto);
    return null;
  }

  const pregunta = lineas[0].replace(/^Pregunta \d+:/, '').trim();
  const opcionesTexto = lineas.slice(1, 5).map(linea => linea.replace(/^[A-D]\)\s*/, '').trim());
  const respuestaTexto = lineas[5].replace('Respuesta:', '').trim();
  
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


const analizarRespuesta_old2 = (bloqueTexto) => {
  console.log("Analizando respuesta:", bloqueTexto);

  const lineas = bloqueTexto.split('\n').filter(linea => linea.trim() !== '');
  
  if (lineas.length < 6) {
    console.error("Formato inesperado en el bloque de respuesta:", bloqueTexto);
    return null;
  }

  const pregunta = lineas[0].replace(/^Pregunta \d+:/, '').trim();
  const opcionesTexto = lineas.slice(1, 5).map(linea => linea.replace(/^[A-D]\)\s*/, '').trim());
  const respuestaTexto = lineas[5].replace('Respuesta:', '').trim();
  
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


const analizarRespuesta = (bloqueTexto) => {
  console.log("Analizando respuesta:", bloqueTexto);

  // Dividir el texto en líneas y eliminar las vacías
  const lineas = bloqueTexto.split('\n').filter(linea => linea.trim() !== '');
  
  // Verificar que hay suficientes líneas
  if (lineas.length < 6) {
    console.error("Formato inesperado en el bloque de respuesta:", bloqueTexto);
    return null;
  }

  // Obtener la pregunta y eliminar el número de la pregunta
  const pregunta = lineas[0].replace(/^Pregunta \d+:/, '').trim();

  // Encontrar la línea que contiene "Opciones:" y eliminarla
  const opcionesInicio = lineas.indexOf('Opciones:') + 1;

  // Verificar que la línea "Opciones:" fue encontrada y hay al menos 4 opciones
  if (opcionesInicio < 1 || opcionesInicio + 3 >= lineas.length) {
    console.error("Opciones no encontradas o insuficientes:", lineas);
    return null;
  }

  // Extraer las opciones y eliminar el prefijo "A) ", "B) ", etc.
  // const opcionesTexto = lineas.slice(opcionesInicio, opcionesInicio + 4).map(linea => {
  //   return linea.replace(/^[A-D]\)\s*/, '').trim();
  // });

   // Extraer las opciones y mantener el formato de A) B) C) D)
   const opcionesTexto = lineas.slice(opcionesInicio, opcionesInicio + 4).map(linea => linea.trim());


  // Obtener la respuesta correcta
  const respuestaTexto = lineas[opcionesInicio + 4].replace('Respuesta:', '').trim();

  
  // Validar el número de opciones
  if (opcionesTexto.length !== 4) {
    console.error("Número incorrecto de opciones:", opcionesTexto);
    return null;
  }

  // Determinar el índice de la respuesta correcta
  const letraRespuestaCorrecta = respuestaTexto.charAt(0);
  const indiceRespuestaCorrecta = letraRespuestaCorrecta.charCodeAt(0) - 65;

  return {
    pregunta,
    opciones: opcionesTexto,
    respuestaCorrecta: opcionesTexto[indiceRespuestaCorrecta]
  };
};


const generateQuestionsFromAI = async (texto) => {
  try {
    console.log("Iniciando generateQuestionsFromAI con texto:", texto);

    const apiKey = process.env.AZURE_OPENAI_KEY;
    const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
    const deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT_NAME;

    if (!apiKey || !endpoint || !deploymentName) {
      throw new Error("Faltan variables de entorno necesarias");
    }

    // Asegúrate de que la URL esté correctamente formada
    const url = `https://Phi-3-mini-128k-instruct-jhloj.eastus2.models.ai.azure.com/chat/completions`;

    const requestBody = {
      messages: [
        { role: "system", content: "Eres un asistente útil que genera preguntas de opción múltiple." },
        { role: "user", content: `Genera 3 preguntas de opción múltiple basadas en este texto: "${texto}".
          Para cada pregunta, proporciona la pregunta, 4 opciones (etiquetadas A, B, C, D) y la respuesta correcta.
          Formatea cada pregunta de la siguiente manera:
          Pregunta [numero de pregunta]: [Tu pregunta aquí]

          Opciones: 
          A) [Opción A] 
          B) [Opción B] 
          C) [Opción C]
          D) [Opción D]

          Respuesta: [Letra de la respuesta correcta]` }
      ],
      max_tokens: 800,
      temperature: 0.7,
      top_p: 1
    };

    console.log("Enviando solicitud a Azure OpenAI...");
    console.log("URL:", url);


    const response = await axios.post(url, requestBody, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,  // Cambiado de 'api-key' a 'Authorization'
      }
    });

    console.log("Respuesta recibida de Azure OpenAI");

    if (response.status === 200) {
      console.log("Respuesta de Azure OpenAI:", response.data.choices[0].message.content);
      
      
      const respuestaCompleta = response.data.choices[0].message.content;
      const bloquesPregunta = respuestaCompleta.split(/(?=Pregunta \d+:)/).filter(bloque => bloque.trim() !== '');

      const preguntas = bloquesPregunta
        .map(bloque => analizarRespuesta(bloque))
        .filter(q => q !== null);

        return preguntas.map((q, index) => ({
        id: generarIdSimple(),
        question:`${index + 1}. ${q.pregunta}`,
        options: q.opciones,
        correctAnswer: q.respuestaCorrecta
      }));



    } else {
      throw new Error(`La solicitud falló con código de estado: ${response.status}`);
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