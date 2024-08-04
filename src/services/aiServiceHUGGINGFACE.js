require("dotenv").config();
const { HfInference } = require("@huggingface/inference");

function generarIdSimple() {
  return Math.random().toString(36).substr(2, 9);
}

let hf;

const inicializarHf = () => {
  if (!process.env.HUGGINGFACE_API_KEY) {
    throw new Error("HUGGINGFACE_API_KEY no está definida en el archivo .env");
  }
  hf = new HfInference(process.env.HUGGINGFACE_API_KEY);
};

try {
  inicializarHf();
} catch (error) {
  console.error("Error al inicializar el cliente de Hugging Face:", error);
}

const analizarRespuesta = (textoRespuesta) => {
  console.log("Analizando respuesta:", textoRespuesta);
  
  // Intentamos extraer la pregunta, opciones y respuesta correcta del texto
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
    respuestaCorrecta: opciones[letraRespuestaCorrecta.charCodeAt(0) - 65] // Convierte 'A', 'B', 'C', 'D' a índice 0, 1, 2, 3
  };
};

const generateQuestionsFromAI = async (texto) => {
  try {
    if (!hf) {
      inicializarHf();
    }

    const prompt = `Genera 3 preguntas de opción múltiple basadas en este texto: "${texto}".
    Para cada pregunta, proporciona la pregunta, 4 opciones (etiquetadas A, B, C, D) y la respuesta correcta.
    Formatea cada pregunta de la siguiente manera:
    Pregunta: [Tu pregunta aquí]
    Opciones: A) [Opción A] B) [Opción B] C) [Opción C] D) [Opción D]
    Respuesta: [Letra de la respuesta correcta]`;

    const respuesta = await hf.textGeneration({
      // modelo: "google/flan-t5-large",
      // model: "mistralai/Mixtral-8x7B-Instruct-v0.1", // en inglés
      // model: "microsoft/Phi-3-mini-4k-instruct", //en español, pero solo 100 tokens
      // model: "meta-llama/Meta-Llama-3-8B-Instruct",
      model: "microsoft/Phi-3-mini-128k-instruct",
      inputs: prompt,
      parameters: {
        max_new_tokens: 500,
        temperature: 0.8,
        top_p: 0.95,
        do_sample: true,
      },
    });

    console.log("Respuesta de Hugging Face:", respuesta.generated_text);
    console.log(respuesta.generated_text);

    const preguntas = respuesta.generated_text.split(/\n\s*\n/)
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
  generateQuestionsFromAI,
};