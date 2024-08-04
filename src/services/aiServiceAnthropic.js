require("dotenv").config();

const Anthropic = require("@anthropic-ai/sdk");

let anthropic;


function generarIdSimple() {
  return Math.random().toString(36).substr(2, 9);
}


const inicializarAnthropic = () => {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY no está definida en el archivo .env");
  }
  anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });
};

try {
  inicializarAnthropic();
} catch (error) {
  console.error("Error al inicializar el cliente de Anthropic:", error);
}

const analizarRespuesta = (textoRespuesta) => {
  console.log("Analizando respuesta:", textoRespuesta);
  
  const coincidenciaPregunta = textoRespuesta.match(/Pregunta:?\s*(.*)/i);
  const coincidenciaOpciones = textoRespuesta.match(/Opciones:?\s*(.*)/i);
  const coincidenciaRespuesta = textoRespuesta.match(/Respuesta:?\s*([A-D])/i);

  if (!coincidenciaPregunta || !coincidenciaOpciones || !coincidenciaRespuesta) {
    console.error("No se pudo analizar la respuesta:", textoRespuesta);
    return null;
  }

  const pregunta = coincidenciaPregunta[1].trim();
  const opciones = coincidenciaOpciones[1].split(/[A-D][.)]\s*/).filter(Boolean).map(opt => opt.trim());
  const letraRespuestaCorrecta = coincidenciaRespuesta[1];

  return {
    pregunta,
    opciones,
    respuestaCorrecta: opciones[letraRespuestaCorrecta.charCodeAt(0) - 65]
  };
};

const generateQuestionsFromAI_Anthropic = async (texto) => {
  try {
    if (!anthropic) {
      inicializarAnthropic();
    }

    const prompt = `Genera 3 preguntas de opción múltiple basadas en este texto: "${texto}".
    Para cada pregunta, proporciona la pregunta, 4 opciones (etiquetadas A, B, C, D) y la respuesta correcta.
    Formatea cada pregunta de la siguiente manera:
    Pregunta: [Tu pregunta aquí]
    Opciones: A) [Opción A] B) [Opción B] C) [Opción C] D) [Opción D]
    Respuesta: [Letra de la respuesta correcta]`;

    const respuesta = await anthropic.completions.create({
      model: "claude-3-sonnet-20240620",
      prompt: prompt,
      max_tokens_to_sample: 1000,
      temperature: 0.7,
      top_p: 0.95,
    });

    console.log("Respuesta de Anthropic:", respuesta.completion);

    const preguntas = respuesta.completion.split(/\n\s*\n/)
      .map(q => analizarRespuesta(q))
      .filter(q => q !== null);

    return preguntas.map(q => ({
      id: generarIdSimple(),
      texto: texto,
      pregunta: q.pregunta,
      opciones: q.opciones,
      respuestaCorrecta: q.respuestaCorrecta
    }));
  } catch (error) {
    console.error("Error en generarPreguntasDesdeIA:", error);
    throw error;
  }
};

module.exports = {
  generateQuestionsFromAI_Anthropic,
};