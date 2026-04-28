import { daprize } from "brain-sdk";
import { redirectMessageToSlackChat } from "./redirectMessageToSlack";
import { processWebhookBridge, processWebhookMessage } from "@utils/meta/meta";
import { MessengerEvent } from "@utils/meta/types";
import "../defaults"

type BridgeEvent = {
  fnName: "sendDirectMessage" | "sendComment"
  params: {
    text: string
  }
}

function isMetaOutboundConfigured() {
  return Boolean(
    process.env.INSTAGRAM_ACCESS_TOKEN ||
    process.env.INSTAGRAM_ACCESS_TOKEN_CARLOS ||
    process.env.INSTAGRAM_ACCESS_TOKEN_INGLESCONLIZA ||
    process.env.CLOUD_API_ACCESS_TOKEN
  );
}

// type ICLWebhookAttachment = {
//   type: string,
//   url: string,
//   caption?: string
//   filename?: string
// }

// export type ICLWebhookPayload = {
//   object: "messenger_bridge",
//   bridge: "whatsapp" | "instagram" | "instagramcomment",
//   id: string,
//   attachments?: ICLWebhookAttachment[],
//   text: string,
//   originChatId: string
//   originMessageId: string
// }

export async function run(event: any, context: any) {
  console.log("👾 meta -> run", JSON.stringify(event, null, 2))
  if (event.fnName) {
    if (!isMetaOutboundConfigured()) {
      console.warn("Skipping meta outbound run because no Meta runtime secrets are configured");
      return;
    }

    console.log("GOT fnName!")
    let bridgeEvent = event as BridgeEvent
    if (event.fnName === "sendDirectMessage" || event.fnName === "sendInstagramMessage") {
      console.log("GOT SendDirectMessage")
      await processWebhookBridge({
        object: "messenger_bridge",
        bridge: "instagram",
        text: bridgeEvent.params.text,
        id: context.redirectEvent.userId.replace("instagram_", ""),
        comment_id: context.redirectEvent.payload.entry[0].changes && context.redirectEvent.payload.entry[0].changes[0].value.id,
      } as MessengerEvent)
    }
    if (event.fnName.toLowerCase() === "sendcomment") {
      console.log("GOT SendComment")
      await processWebhookBridge({
        object: "messenger_bridge",
        bridge: "instagramcomment",
        text: "@" + context.redirectEvent.userName + ": " + bridgeEvent.params.text,
        id: context.redirectEvent.payload.entry[0].changes[0].value.id
      } as MessengerEvent)
    }
    if (event.fnName === "sendWhatsappMessage") {
      console.log("GOT SendDirectMessage")
      await processWebhookBridge({
        object: "messenger_bridge",
        bridge: "whatsapp",
        text: bridgeEvent.params.text,
        id: context.redirectEvent.userId.replace("whatsapp_", ""),
      } as MessengerEvent)
    }

  } else if (event?.object) {
    await processWebhookMessage(event)
  } else if (event?.channel_id) {
    await redirectMessageToSlackChat(event)
  } else {
    console.warn("Skipping meta run because event shape is not recognized");
  }
}

export const sqs = daprize(run)

if (typeof require !== "undefined" && typeof module !== "undefined" && require.main === module) {
  // This is only for local testing

  (async () => {
    let event = {
      "event": {
        "fnName": "sendComment",
        "params": {
          "text": "Revisa tus mensajes directos para más detalles."
        }
      },
      "context": {
        "event": {
          "subtype": "bot_message",
          "text": "_Commented on post_ <https://www.instagram.com/reel/DIegEXZuBv7/|:point_down: ¿Te gustó? >:\nRutina",
          "username": "gasofia5",
          "icons": {
            "image_48": "https://s3-us-west-2.amazonaws.com/slack-files2/bot_icons/2025-06-29/9115656304323_48.png"
          },
          "type": "message",
          "ts": "1751251208.777379",
          "bot_id": "B081AM1MACX",
          "app_id": "A081TNA8XPW",
          "blocks": [
            {
              "type": "rich_text",
              "block_id": "eaZ",
              "elements": [
                {
                  "type": "rich_text_section",
                  "elements": [
                    {
                      "type": "text",
                      "text": "Commented on post",
                      "style": {
                        "italic": true
                      }
                    },
                    {
                      "type": "text",
                      "text": " "
                    },
                    {
                      "type": "emoji",
                      "name": "point_down",
                      "unicode": "1f447"
                    },
                    {
                      "type": "link",
                      "url": "https://www.instagram.com/reel/DIegEXZuBv7/",
                      "text": " ¿Te gustó?"
                    },
                    {
                      "type": "text",
                      "text": ":\nRutina"
                    }
                  ]
                }
              ]
            }
          ],
          "channel": "C085CLN4AU8",
          "event_ts": "1751251208.777379",
          "channel_type": "group"
        },
        "config": {},
        "state": {
          "isBotMessage": true,
          "channelId": "C085CLN4AU8",
          "eventTs": "1751251208.777379",
          "isIm": false,
          "isGroup": true,
          "messageUsername": "gasofia5",
          "incomingMessageText": "_Commented on post_ <https://www.instagram.com/reel/DIegEXZuBv7/|:point_down: ¿Te gustó? >:\nRutina",
          "hasBotProfile": false,
          "channelContext": {
            "config": {
              "disableBot": false,
              "sendToBus": "support",
              "skipUserHistory": true,
              "onlyUsernames": true,
              "onlyThreadHistory": true,
              "isMechanical": true
            },
            "bot": {
              "text": "Esta comunicación ocurre via instagram, son comentarios públicos, las respuestas deben ser cortas y agradables, con un tono casual, sencillo y humano.\n- Responde de manera breve y clara, usando un tono positivo y accesible que genere una buena impresión pública.\n- Usa emojis y un lenguaje que refleje entusiasmo y cercanía.\n- Si la respuesta requiere más detalles, invita al usuario a escribirte por mensaje privado para continuar la conversación.\nno repitas \"Hola\" si ya se lo dijiste una vez, trata de mantener un hilo coherente entre las comunicaciones y mostrar que te recuerdas de lo que han hablado previamente.\nnunca menciones a ChatGPT, nunca digas que tienes algo que ver con ChatGPT.\nno olvides mencionar al usuario especialmente en el primer mensaje, el que response al comentario.\nSi preguntan sobre costos, diles que con gusto les puedes dar los costos por whatsapp https://inglesconliza.com/whatsapp\nhay comentarios que intentan resolver el reto que está en el contenido del post, ayudarlos a resolverlo.\nRecuerda escribir un mensaje corto directo al comentario mencionando que le dejarás un mensaje a la persona.\nSi el comentario se sale del contexto específico del aprendizaje de inglés, solo di \"AYUDA\"\nSiempre que menciones cualquiera de nuestros productos o eventos (Guia, Semana del Ingles, Club, etc), dále un enlace o una URL para conseguirlo fácilmente.\nenviar la guía a los usuarios que comenten eBook\nno hace falta que envíes dos veces el mensaje, solo una sola vez para cada usuario.\nlos que comenten 10 enviar la guía de los 10 tips para mejorar tu inglés: https://inglesconliza.com/pdf10tips\n🟡 ¿Qué programas tienes?\nClaro, te cuento 💛\nTengo dos opciones principales:\n1️⃣ El Club de Inglés – $39.90/mes Recibes clases todos los días (lunes a viernes) por email. Solo le das clic a “Entrar” y accedes desde tu cuenta en inglesconliza.com. Son lecciones tipo Reel, con PDF, quiz, vocabulario útil y logros diarios.\n2️⃣ Clases de speaking grupales (incluyen el Club):\n1 clase por semana: $83\n2 clases por semana: $139\n3 clases por semana: $209\nSon clases en vivo, con grupos reducidos y profes expertos. Si quieres avanzar hablando, esta es ideal 🔥\n¿Te gustaría saber cuál se adapta mejor a ti?\n🟡 ¿Cómo funciona el Club de Inglés?\nEl Club es como tu rutina diaria de inglés 💛💛\nDe lunes a viernes te llega por correo tu clase del día. Solo haces clic en “Entrar” y desde tu cuenta accedes al contenido.\n¿Qué incluye?\nVideo corto tipo Reel\nPDF descargable\nQuiz\nLogro del día\nImportante: si no abres tu clase, no se activa la del día siguiente. 💸 Son $39.90 al mes y puedes cancelar cuando quieras.\nAquí puedes unirte:https://curso.inglesconliza.com/club-de-ingles/\n🟡 ¿Y las clases de speaking?\n¡Son en vivo! 🗣️✨ Sesiones de 60 minutos, con grupos pequeños y profes políglotas.\nHay 2 niveles: básico y nivel intermedio. Incluyen acceso completo al Club de Inglés.\n1 clase/semana: $83\n2 clases/semana: $139\n3 clases/semana: $209\n¿Quieres ver los horarios y elegir tu nivel? Aquí tienes el calendario para inscribirte:https://www.inglesconliza.com/speaking\n🟡 Ya me inscribí pero no recibí nada\n¡Gracias por inscribirte! 💛\nPorfa revisá tu correo (también en promociones o spam). Y agrégame como contacto para que te lleguen bien los correos.\n🟡 Para el Club: entra a inglesconliza.com, ve a tu dashboard y abre tu clase del día. ⚠️ Si no abrís la clase de hoy, no te llegará la de mañana. (Solo hay clases de lunes a viernes).\n🟡 ¿Puedo cambiarme de nivel?\n¡Sí, claro que sí! Si no te sentís cómodo con el grupo, puedes cambiarte de nivel cuando quieras. Solo avisame 💬\n🟡 ¿Hay permanencia? ¿Tengo que quedarme muchos meses?\nNo, nada de eso 😊 Es una suscripción mensual y podés cancelar cuando quieras desde tu cuenta. Sin compromiso.\n🟡 ¿Tienes algo más personalizado?\nSí, tengo mi programa más completo: Mentoría con Liza 💡\nIncluye:\n24 sesiones personalizadas con profesor\n3 sesiones conmigo (la primera es para armar tu plan con la técnica de Neural Language Coaching)\nAcceso ilimitado al Club de Inglés y a todas las clases de speaking\nContacto directo conmigo por WhatsApp durante los 3 meses\nResultados garantizados al final\n💰 Son $1500 el programa completo. Aquí puedes ver más:https://curso.inglesconliza.com/mentorias-de-ingles-con-liza/\n🟡 Oferta especial (para cerrar la venta)\n¡Justo ahora tengo una promo especial! 🔥\nClub de Inglés + 1 clase de speaking por solo $59 (Precio regular $83) Es por tiempo limitado 🙌\n¿Quieres que te pase el link para tu nivel?\n🟣 OPCIONES PARA CIERRE DE VENTA – OFERTA ESPECIAL\n🟡 Opción 1 – Oferta del día (rápida y directa)\n¡Tengo una oferta solo por hoy! Club de Inglés + clase de speaking por solo $59 (precio regular $83). Incluye acceso completo a todo el contenido y clases en vivo.\n¿Te la paso antes de que se acabe?\n🟡 Opción 2 – Cupón activo por 2 horas\n¡Estás a tiempo! Tengo un cupón de 75% activo por solo 2 horas ⏳ Puedes inscribirte al Club + clase de speaking en tu nivel:\nBásico: https://www.inglesconliza.com/speakingBasicoMasClub?cupon=FINAL75\nIntermedio: https://www.inglesconliza.com/speakingIntermedioMasClub?cupon=FINAL75\nEs una oportunidad top si querés avanzar hablando inglés todos los días 💛\n🟡 Opción 3 – Oferta “Club por solo $19” (exclusiva de seguimiento)\nComo ya venimos hablando, te quiero dar esta oferta exclusiva solo por hoy 👀 El Club de Inglés por solo $19.38 al mes (precio normal $39.90).\nAccedes a contenido diario, clases con video, PDF, quiz y acompañamiento. Podés cancelar cuando quieras.\n🔗 https://curso.inglesconliza.com/club-de-ingles-con-liza/\nSi quieres sumarte hoy, este es el mejor momento 💛\n🟡 Opción 4 – Clase de prueba en el calendario\nSi quieres probar las clases de speaking directamente, podés reservar una ya: 🔗 https://www.inglesconliza.com/speaking\nAhí elegís tu nivel (básico o intermedio) y el horario que más te convenga 💬 Incluye acceso gratis al Club de Inglés también.\n🟡 Opción 5 – Cierre con sensación de urgencia + beneficio doble\n¡Aprovecha hoy! Si te inscribís ahora al Club + speaking, te guardo tu grupo y el precio congelado para siempre 💛\nEn 5 minutos te paso el enlace con tu nivel y ya podés comenzar esta misma semana 💬\n🟡 Opción 6 – \"Te acompaño personalmente\" (refuerzo emocional)\nSi te gustaría avanzar pero no sabes cuál elegir, escribime y te ayudo a elegir la mejor opción para vos. Hoy tenemos una promo muy especial, y me encantaría que empieces con algo adaptado a tu ritmo y nivel.\nClub de inglés - $39.90\nhttps://curso.inglesconliza.com/club-de-ingles/\nClub + clases de speaking:\nClub de inglés + 1 clase de speaking $59 en vez de $83 al mes\nClub de inglés + 2 clases de speaking $99 en vez de $399 al mes\nClub de inglés + 3 clases de speaking $149 en vez de $599 al mes\nCupón de descuento valido por 2 horas:\nBásico\nhttps://www.inglesconliza.com/speakingBasicoMasClub?cupon=FINAL75\nIntermedio:\nhttps://www.inglesconliza.com/speakingIntermedioMasClub?cupon=FINAL75\nEnlaces en general:\nClub de inglés: https://curso.inglesconliza.com/club-de-ingles/ \nClases de speaking: https://curso.inglesconliza.com/clases-de-speaking/ \nClases de speaking individuales: https://curso.inglesconliza.com/clases-de-speaking-individuales/ \nSobre mi: https://curso.inglesconliza.com/about-me/ \nClub + clases de speaking (lo que está en la página sin promoción)\nEsto es genérico, reservan directo y luego seleccionan su nivel.\nUSD 83.86 al mes - https://curso.inglesconliza.com/clases-de-speaking/\nUSD 139.86 al mes - https://curso.inglesconliza.com/clases-de-speaking/\nUSD 209.86 al mes - https://curso.inglesconliza.com/clases-de-speaking/\nPromo exclusiva en casos que ya hiciste mucho follow up, oferta pot 1 día club de inglés a $19.38 https://curso.inglesconliza.com/club-de-ingles-con-liza/\n🌳 FLUJO AUTOMÁTICO: RESPUESTAS PARA VENTAS\n1️⃣ Inicio: “Hola / Quiero info / Me interesa”\nRespuesta:\n¡Hola! 💛 Soy Liza. Qué alegría que estés por acá. ¿Qué te gustaría trabajar con tu inglés?\nMejorar todos los días con clases prácticas\nHablar fluido con clases en vivo\nAlgo más personalizado\n🔁 Si responde 1 (mejorar todos los días)\nRespuesta:\nGenial 💛 Entonces lo tuyo es el Club de Inglés. Son clases nuevas cada día (lunes a viernes) con video tipo Reel, PDF, quiz y práctica real. Lo ves desde tu cuenta en inglesconliza.com.🔥 Hoy puedes entrar por solo $19.38 con esta promo: 👉 https://curso.inglesconliza.com/club-de-ingles-con-liza/¿Te gustaría empezar ahora?\n🔁 Si responde 2 (hablar fluido en vivo)\nRespuesta:\n¡Perfecto! 🙌 Las clases de speaking en grupo son en vivo, 60 minutos, con profes expertos y grupos pequeñitos. Incluyen también el Club de Inglés para que practiques cada día.Estos son los planes mensuales:\n1 clase/semana: $83\n2 clases/semana: $139\n3 clases/semana: $209\nHoy tengo una promo especial: 🎁 Club + 1 clase por solo $59\n📆 Aquí elegís tu nivel y horario:https://www.inglesconliza.com/speaking\n¿Querés que te guíe a cuál nivel te conviene más?\n🔁 Si responde 3 (algo personalizado)\nRespuesta:\n¡Te entiendo 100%! 💛 Tengo mi programa de Mentoría Personalizada, donde trabajamos tu inglés con plan 1 a 1 y resultados claros.Incluye:\n24 sesiones con profe\n3 sesiones conmigo\nAcceso a todo el Club y speaking\nApoyo directo por WhatsApp\n💰 Costo: $1500 por 3 meses 👉 Más info: https://curso.inglesconliza.com/mentorias-de-ingles-con-liza/\n¿Querés que te mande un audio contándote cómo funciona?\n🔁 Si responde algo general (Ej: “quiero hablar mejor” / “me cuesta todo” / “no sé qué elegir”)\nRespuesta:\n¡Gracias por compartir eso! 💬 Mira, si querés mejorar poco a poco con clases prácticas y fáciles, el Club es ideal. Si ya querés hablar en vivo, las clases de speaking te van a encantar.¿Querés que te ayude con una recomendación según tu nivel? Solo decime si eres más principiante, intermedio o avanzado 🙌\n🔁 Si pregunta: ¿es mensual? ¿hay compromiso?\nRespuesta:\nTodo funciona por suscripción mensual. Puedes cancelar cuando quieras desde tu cuenta, sin permanencia ni líos 💛\n🔁 Si ya pagó pero tiene dudas\nRespuesta:\n¡Gracias por unirte! 💛 Fijate si el correo de bienvenida llegó a promociones o spam, y agregame como contacto.Para el Club: entrá a inglesconliza.com y abrí tu clase del día (si no la abrís, no te llega la siguiente). Para speaking: te llegará un correo 1 hora antes de tu clase con el enlace 💬\n\n"
            },
            "mech": {
              "text": "",
              "title": "[mech] Responses",
              "json": [
                {
                  "mech": [
                    "Responses\n"
                  ],
                  "config": [
                    "set parser json\n"
                  ],
                  "hashtags": [
                    "rutina\n"
                  ],
                  "comment": [
                    "Revisa tus mensajes directos para más detalles.\n"
                  ],
                  "dm": [
                    "Prompt para ChatGPT:\n​\nHola, ChatGPT. Estoy buscando ayuda para crear una rutina de estudio de inglés para 1 hora, adaptada para un nivel A2. Me gustaría que incluyas actividades equilibradas que abarquen calentamiento, gramática, vocabulario, lectura, conversación y revisión. También quiero sugerencias de recursos o ejercicios específicos para cada parte de la rutina. ¡Gracias!\nSi quieres avanzar todos los días únete a mi club con esta promo limitada por hoy 👉👉\nhttps://curso.inglesconliza.com/club-de-ingles-con-liza/?utm_source=metameta&amp;utm_campaign=lettrythis\n"
                  ]
                },
                {
                  "hashtags": [
                    "vip\n"
                  ],
                  "comment": [
                    "Revisa tus mensajes directos para más detalles.\n"
                  ],
                  "dm": [
                    "Aquí tienes el enlace para unirte a mi grupo de WhatsApp:\nhttps://inglesconliza.com/comunidad\n​\nEscríbeme por WhatsApp y te ayudo a encontrar el mejor camino para avanzar:\n​\n📌 Clases de speaking semanales para soltar tu inglés\n​\n📌 Club de Inglés con contenido diario, fácil y práctico\n​\n​\n✨ Te explico todo y te recomiendo lo ideal según tu nivel.\n​\nDa el primer paso hoy.\n​\n¡Estoy para ayudarte! ❤️\nEscribir a Liza 👉 https://wa.me/message/KVOXTS3RQ7KYC1\n​\n"
                  ]
                },
                {
                  "hashtags": [
                    "brunch\n"
                  ],
                  "comment": [
                    "Revisa tus mensajes directos para más detalles.\n"
                  ],
                  "dm": [
                    "Para saber mas sobre el Brunch, entra al grupo de WhatsApp: https://inglesconliza.com/comunidad\n¡Nos vemos ahí! 🚀\n"
                  ]
                },
                {
                  "hashtags": [
                    "10tips\n"
                  ],
                  "comment": [
                    "¡Gracias por comentar! Revisa tus DMs 💌\n"
                  ],
                  "dm": [
                    "¡Hola! 🤗 Te envío la guía en PDF de las \"10 Tips para hablar en Inglés\":\nAquí tienes el enlace: https://www.inglesconliza.com/pdf10tips solo tienes que poner tu correo electrónico y podrás descargarla.\nPromo limitada por 2 horas: https://curso.inglesconliza.com/club-de-ingles-con-liza/\n¡Un abrazo! 💕\n"
                  ]
                },
                {
                  "hashtags": [
                    "ebook\n"
                  ],
                  "comment": [
                    "¡Enlace del ebook enviado por mensaje privado! 🚀\n",
                    "¡Te lo envié por privado!\n",
                    "Revisa tus DMs! 🚀\n"
                  ],
                  "dm": [
                    "¡Hola! 🤗 Te envío el ebook en PDF de las \"10 Tips para hablar en Inglés\":\nAquí tienes el enlace: https://www.inglesconliza.com/pdf10tips solo tienes que poner tu correo electrónico y podrás descargarla.\nPromo limitada por 2 horas: https://curso.inglesconliza.com/club-de-ingles-con-liza/?utm_source=metameta&amp;utm_campaign=lettrythis\n¡Un abrazo! 💕\n"
                  ]
                },
                {
                  "hashtags": [
                    "comunidad\n"
                  ],
                  "comment": [
                    "Te envié el enlace a la comunidad por mensaje directo ☺️\n",
                    "¡Te lo envié por privado!\n",
                    "Revisa tus DMs! 🚀ñlñ\n"
                  ],
                  "dm": [
                    "¿Quieres recibir tips de inglés todos los días, practicar frases reales y mantenerte motivado?\n​\nÚnete gratis a mi comunidad en WhatsApp 📲\n​\n✨ Progress, not perfection.\n​\nComunidad: https://inglesconliza.com/comunidad\n"
                  ]
                },
                {
                  "hashtags": [
                    "running\n"
                  ],
                  "comment": [
                    "Te envié el enlace a la comunidad por mensaje directo ☺️\n",
                    "Check your DMs! 💕\n",
                    "Revisa tus comentarios!\n",
                    "Enviado por mensaje privado!\n"
                  ],
                  "dm": [
                    "¿Quieres recibir tips de inglés todos los días, practicar frases reales y mantenerte motivado/a? Únete gratis a mi comunidad en WhatsApp 📲 Es contenido útil, rápido y directo a tu celular.\n✨ Progress, not perfection.\nComunidad: https://inglesconliza.com/comunidad\n"
                  ]
                },
                {
                  "hashtags": [
                    "club\n"
                  ],
                  "comment": [
                    "Te envié el enlace por mensaje directo ☺️\n",
                    "Check your DMs! 💕\n",
                    "Enviado por mensaje privado!\n",
                    "Revisa tus comentarios!\n"
                  ],
                  "dm": [
                    "¿Sientes que necesitas mejorar tu inglés pero no sabes por dónde empezar? 💬\n​\nEscribir a Liza 👉 https://wa.me/message/KVOXTS3RQ7KYC1\n​\n👇 ¡No lo dejes pasar! ✅\n​\nhttps://curso.inglesconliza.com/club-de-ingles-con-liza/\n"
                  ]
                },
                null,
                {
                  "end": [],
                  "hashtags": [
                    "default\n"
                  ],
                  "comment": [
                    "Te envié el enlace a la comunidad por mensaje directo ☺️\n",
                    "Check your DMs! 💕\n",
                    "Revisa tus comentarios!\n",
                    "Enviado por mensaje privado!\n"
                  ],
                  "dm": [
                    "Te espero en mi comunidad de WhatsApp\n​\n👉 https://inglesconliza.com/comunidad\n​\n​\nAvancemos juntos 👉\nhttps://curso.inglesconliza.com/club-de-ingles-con-liza/\n​\n¡ A mejorar tu inglés!\n"
                  ]
                },
                null,
                {
                  "end": [],
                  "hashtags": [
                    "restaurante\n"
                  ],
                  "comment": [
                    "¡Enlace del ebook enviado por mensaje privado! 🚀\n",
                    "¡Te lo envié por privado!\n",
                    "Revisa tus DMs! 🚀\n"
                  ],
                  "dm": [
                    "¡Hola! 🤗\n​\nTe envío mi audio guía gratuita:\nhttps://pronuncia.inglesconliza.com/20-restaurant\n​\nClub de inglés — crea tu hábito diario conmigo.\n​\n👉 https://curso.inglesconliza.com/club-de-ingles-con-liza/\n​\n¡Un abrazo! 💕\n"
                  ]
                },
                null,
                {
                  "end": [],
                  "hashtags": [
                    "ebook\n"
                  ],
                  "comment": [
                    "¡Tu guía va en camino! :wink:\n",
                    "Revisa tus DMs! :sparkles:\n",
                    "¡Te lo envió por privado! :relaxed:\n"
                  ],
                  "dm": [
                    "😊 Aquí va tu guía que lo disfrutes.\nhttps://www.inglesconliza.com/guia\nComienza a perder el miedo hoy mismo 👉  https://curso.inglesconliza.com/club-de-ingles-con-liza/\n"
                  ]
                },
                null,
                {
                  "end": [],
                  "hashtags": [
                    "50\n"
                  ],
                  "comment": [
                    "Revisa tus DMs:sparkles:\n",
                    "¡Te lo envío por privado!:smiling_face_with_3_hearts:\n",
                    "¡Tus frases van en camino!:wink:\n"
                  ],
                  "dm": [
                    "¡Hola! Aquí van tus 50 Frases :blush:\nhttps:www.inglesconliza.com/pdf100frases\n:gift: Promo flash! por tiempo limitado por 2 horas: https://curso.inglesconliza.com/club-de-ingles-con-liza/?utm_source=metameta&amp;utm_campaign=lettrythis\n¡Abrazo!:sparkles::hugging_face:\n"
                  ]
                },
                null,
                {
                  "end": [],
                  "hashtags": [
                    "100\n"
                  ],
                  "comment": [
                    "Te lo envío al DM:sparkles:\n",
                    "Revisa tus DMs:hugging_face:\n",
                    "¡En camino!:gift:\n"
                  ],
                  "dm": [
                    "¡Aquí va tu regalo con 100 frases!\n​\nhttps://inglesconliza.com/pdf100frases\n​\nMejora tu inglés conmigo, promo limitada:\n​\nhttps://curso.inglesconliza.com/club-de-ingles-con-liza/\n​\n¡Abrazo!\n"
                  ]
                },
                null,
                {
                  "end": [],
                  "hashtags": [
                    "cumple\n"
                  ],
                  "comment": [
                    "Te lo envío al DM:sparkles:\n",
                    "Revisa tus DMs:hugging_face:\n",
                    "¡En camino! :gift:\n"
                  ],
                  "dm": [
                    "Hola, estoy feliz de cumplir años y celebrar 1 año desde el lanzamiento de nuestro club de inglés con Liza y ¡quiero celebrarlo contigo! Te espero en el club.\n​\n:gift::sparkles: Promo flash: Por tiempo limitado por 2 horas:\nhttps://curso.inglesconliza.com/club-de-ingles-con-liza/\n"
                  ]
                },
                null,
                {
                  "end": [],
                  "hashtags": [
                    "yes\n"
                  ],
                  "comment": [
                    "¡Tu guía va en camino! :wink:\n",
                    "tus DMs! :sparkles:\n",
                    "¡Te lo envió por privado! :relaxed:\n"
                  ],
                  "dm": [
                    "¡YES! :hugging_face: Aquí va tu guía que lo disfrutes.\nhttps://www.inglesconliza.com/guia\n:gift:¡Promo flash! por tiempo limitado por 2 horas: https://curso.inglesconliza.com/club-de-ingles-con-liza/?utm_source=metameta&amp;utm_campaign=lettrythis\n¡Abrazos! :sparkles::two_hearts:\n"
                  ]
                },
                null,
                {
                  "end": [],
                  "hashtags": [
                    "guide\n"
                  ],
                  "comment": [
                    "¡Tu guía va en camino! :wink:\n",
                    "Revisa tus DMs! :sparkles:\n",
                    "¡Te lo envió por privado! :relaxed:\n"
                  ],
                  "dm": [
                    "Hola, ¿cómo estás?  Aquí va tu guía que lo disfrutes.\nhttps://pronuncia.inglesconliza.com\n​\n¡Promo flash solo por HOY!  Haz clic aquí 👉 https://curso.inglesconliza.com/club-de-ingles-con-liza/?utm_source=metameta&amp;utm_campaign=lettrythis\n​\n¡Abrazos!\n"
                  ]
                },
                null,
                {
                  "end": [],
                  "hashtags": [
                    "avanzar\n"
                  ],
                  "comment": [
                    "¡Tu guía va en camino!\n",
                    "Revisa tus DMs!\n",
                    "¡Te lo envió por privado!\n"
                  ],
                  "dm": [
                    "Te espero en el club de inglés con Liza, ¡oferta única por 2 horas!\n​\n¿Sientes que necesitas mejorar tu inglés pero no sabes por dónde empezar? 💬\n​\nEscribir a Liza 👉 https://wa.me/message/KVOXTS3RQ7KYC1\n"
                  ]
                },
                null,
                {
                  "end": [],
                  "hashtags": [
                    "rutina\n"
                  ],
                  "comment": [
                    "¡Tu guía va en camino! :wink:\n",
                    "Revisa tus DMs! :sparkles:\n",
                    "¡Te lo envió por privado! :relaxed:\n"
                  ],
                  "dm": [
                    "Prompt listo para usar en ChaGPT:\n​\nActúa como un profesor de inglés especializado en estudiantes de nivel A2. Ayúdame a crear una rutina de estudio semanal para mejorar mi inglés en las 5 habilidades: listening, speaking, reading, writing y grammar. Quiero estudiar 5 días a la semana durante 30 a 60 minutos al día. Divide la rutina por días, sugiere actividades concretas, recursos gratuitos online (como videos, canciones, ejercicios interactivos), y finaliza cada día con una pequeña evaluación o repaso.\n​\n¿Y si hoy fuera el día que empezás a hablar inglés sin miedo?\n​\nEsta es tu oportunidad:\n🎯 Oferta FLASH abierta por pocas horas\n​\n🎁 Precio exclusivo, sin compromisos\n​\n👉 https://curso.inglesconliza.com/club-de-ingles-con-liza/\n​\n​\n"
                  ]
                },
                null,
                {
                  "end": [],
                  "hashtags": [
                    "tesst\n"
                  ],
                  "comment": [
                    "¡Gracias por comentar! Revisa tus DMs 💌\n"
                  ],
                  "dm": [
                    "¡Hola! 👋\n​\nLa respuesta correcta es:\n✅ settled down que significa asentarse.\n🙌 Es un phrasal verb muy usado.\n​\n¿Quieres seguir avanzando con una estructura clara todos los días? 🗓️\n​\nÚnete a mi club de inglés y comenzamos: https://curso.inglesconliza.com/club-de-ingles-con-liza/\n​\n¡Un abrazo! 💕\n"
                  ]
                },
                null,
                {
                  "end": [],
                  "hashtags": [
                    "secreto\n"
                  ],
                  "comment": [
                    "¡Tu envié algo! :wink:\n",
                    "Revisa tus DMs! :sparkles:\n",
                    "¡Te lo envió por privado! :relaxed:\n"
                  ],
                  "dm": [
                    "¿Sientes que necesitas mejorar tu inglés pero no sabes por dónde empezar? 💬\n​\nEscríbeme por WhatsApp y te ayudo a encontrar el mejor camino para avanzar:\n📌 Clases de speaking semanales para soltar tu inglés\n📌 Club de Inglés con contenido diario, fácil y práctico\n​\n✨ Te explico todo y te recomiendo lo ideal según tu nivel.\n​\nDa el primer paso hoy.\n​\n¡Estoy para ayudarte! ❤️\n​\nEscribir a Liza 👉 https://wa.me/message/KVOXTS3RQ7KYC1\n​\n​\n"
                  ]
                },
                null,
                {
                  "end": [],
                  "hashtags": [
                    "test\n"
                  ],
                  "comment": [
                    "¡Enlace del ebook enviado por mensaje privado! 🚀\n",
                    "¡Te lo envié por privado!\n",
                    "Revisa tus DMs! 🚀\n"
                  ],
                  "dm": [
                    "¡Hola! 🤗\n​\nTe envío mi test de nivelación: https://www.inglesconliza.com/nivelacion\n​\n¿Quieres saber más sobre mis programas? Te espero en mi comunidad de WhatsApp donde envío tips diarios:\n​\nhttps://inglesconliza.com/comunidad\n​\n¡Te espero! 💕\n"
                  ]
                },
                null,
                {
                  "end": [],
                  "hashtags": [
                    "puedo\n"
                  ],
                  "comment": [
                    "¡Tu envié algo! :wink:\n",
                    "Revisa tus DMs! :sparkles:\n",
                    "¡Te lo envió por privado! :relaxed:\n"
                  ],
                  "dm": [
                    "¿Sientes que necesitas mejorar tu inglés pero no sabes por dónde empezar? 💬\n​\nEscríbeme por WhatsApp y te ayudo a encontrar el mejor camino para avanzar:\n📌 Clases de speaking semanales para soltar tu inglés\n📌 Club de Inglés con contenido diario, fácil y práctico\n​\n✨ Te explico todo y te recomiendo lo ideal según tu nivel.\n​\nDa el primer paso hoy.\n​\n¡Estoy para ayudarte! ❤️\n​\nEscribir a Liza 👉 https://wa.me/message/KVOXTS3RQ7KYC1\n​\n"
                  ]
                },
                null,
                {
                  "end": [],
                  "hashtags": [
                    "hablarss\n"
                  ],
                  "comment": [
                    "¡Tu envié algo! :wink:\n",
                    "Revisa tus DMs! :sparkles:\n",
                    "¡Te lo envió por privado! :relaxed:\n"
                  ],
                  "dm": [
                    "¿Sientes que necesitas mejorar tu inglés pero no sabes por dónde empezar? 💬\n"
                  ]
                },
                {
                  "hashtags": [
                    "tt\n"
                  ],
                  "comment": [
                    "¡Tu envié algo! :wink:\n",
                    "Revisa tus DMs! :sparkles:\n",
                    "¡Te lo envió por privado! :relaxed:\n"
                  ],
                  "dm": [
                    "La respuesta correcta es:\n✅ I’m trying out the couch / sofa.\n​\n¿Sientes que necesitas mejorar tu inglés pero no sabes por dónde empezar? 💬\n​\nEscríbeme por WhatsApp y te ayudo a encontrar el mejor camino para avanzar:\nEscribir a Liza 👉 https://wa.me/message/KVOXTS3RQ7KYC1\n"
                  ]
                },
                null,
                {
                  "end": [],
                  "hashtags": [
                    "cocina\n"
                  ],
                  "comment": [
                    "¡Tu envié algo! :wink:\n",
                    "Revisa tus DMs! :sparkles:\n",
                    "¡Te lo envió por privado! :relaxed:\n"
                  ],
                  "dm": [
                    "🍴 30 Common Kitchen Utensils in English\nKnife – cuchillo\nFork – tenedor\nSpoon – cuchara\nTeaspoon – cucharita\nTablespoon – cuchara grande\nCutting board – tabla de cortar\nPeeler – pelador\nGrater – rallador\nWhisk – batidor de mano\nSpatula – espátula\nTongs – pinzas\nLadle – cucharón\nColander – colador grande / escurridor\nStrainer – colador fino\nMeasuring cup – taza medidora\nMeasuring spoons – cucharas medidoras\nCan opener – abrelatas\nBottle opener – abrebotellas\nCorkscrew – sacacorchos\nMixing bowl – bowl para mezclar\nRolling pin – rodillo\nFrying pan / Skillet – sartén\nSaucepan – cacerola\nPot – olla\nBaking sheet / Tray – bandeja para hornear\nOven mitt – guante para horno\nKitchen scissors – tijeras de cocina\nGarlic press – prensa ajos\nZester – rallador fino para cítricos\nFood thermometer – termómetro de cocina\n​\n¿Sientes que necesitas mejorar tu inglés pero no sabes por dónde empezar? 💬\n​\nEscribir a Liza 👉 https://wa.me/message/KVOXTS3RQ7KYC1\n"
                  ]
                },
                null,
                {
                  "hashtags": "rutina",
                  "comment": "Revisa tus mensajes directos para más detalles.",
                  "dm": "Prompt para ChatGPT:\n​\nHola, ChatGPT. Estoy buscando ayuda para crear una rutina de estudio de inglés para 1 hora, adaptada para un nivel A2. Me gustaría que incluyas actividades equilibradas que abarquen calentamiento, gramática, vocabulario, lectura, conversación y revisión. También quiero sugerencias de recursos o ejercicios específicos para cada parte de la rutina. ¡Gracias!\nSi quieres avanzar todos los días únete a mi club con esta promo limitada por hoy 👉👉\nhttps://curso.inglesconliza.com/club-de-ingles-con-liza/?utm_source=metameta&amp;utm_campaign=lettrythis"
                },
                null
              ]
            }
          }
        },
        "promises": [],
        "redirectEvent": {
          "text": "*Commented on post* [👇 ¿Te gustó? ](https://www.instagram.com/reel/DIegEXZuBv7/):\nRutina",
          "channel_id": "C085CLN4AU8",
          "username": "gasofia5",
          "payload": {
            "entry": [
              {
                "id": "17841401707784079",
                "time": 1751251199,
                "changes": [
                  {
                    "value": {
                      "from": {
                        "id": "971012135018216",
                        "username": "gasofia5"
                      },
                      "media": {
                        "id": "18030545111361862",
                        "media_product_type": "REELS"
                      },
                      "id": "18031014803478609",
                      "text": "Rutina"
                    },
                    "field": "comments"
                  }
                ]
              }
            ],
            "object": "instagram"
          },
          "update_id": "18031014803478609",
          "useBot": "@taskgptbot",
          "content": "Rutina",
          "userName": "gasofia5",
          "userId": "instagram_971012135018216",
          "change": {
            "value": {
              "from": {
                "id": "971012135018216",
                "username": "gasofia5"
              },
              "media": {
                "id": "18030545111361862",
                "media_product_type": "REELS"
              },
              "id": "18031014803478609",
              "text": "Rutina"
            },
            "field": "comments"
          },
          "xid": "X5FVL",
          "chatGptMode": "GetCommentAndResponse",
          "chatGptContext": "These are comments attached to an instagram post with this caption: 👇 ¿Te gustó? \n\nEscribe la palabra RUTINA en los comentarios y te envío mi prompt listo para copiar y pegar.\n\n ¡Hazlo ahora antes de que se pierda entre tantos reels! 😉\n\n#rutina #InglésConChatGPT #AprendeInglés #Inglesonline #ChatGPTTips #HackDeIdiomas  #ViralEnglish #inglésconLiza"
        }
      }
    }

    await run(event.event, event.context)


  })()
}
