type Piece = {
  [key: string]: string[] | string;
  hashtags?: string[] | string;
  comment?: string[] | string;
  dm?: string[] | string;
}

type MechPayload = Piece[]

export function selectRandomOne(array: any[]) {
  const randomIndex = Math.floor(Math.random() * array.length);
  return array[randomIndex];
}

export function extractHashtags(text: string) {
  const regex = /#\w+/g;
  const matches = text.match(regex);
  return matches ? matches.map((match) => match.replace(/#/g, "")) : [];
}

type MechResponse = {
  comment: string;
  dm: string
}

export function getResponseForHashtags(payload: MechPayload, postText: string): MechResponse {
  let hashtagsInPost = extractHashtags(postText);
  hashtagsInPost.push("default");
  let selectedResponse = matchHashtag(payload, hashtagsInPost);

  // Ensure we return a properly typed object
  if (!selectedResponse) {
    return {
      comment: "",
      dm: ""
    };
  }

  return selectedResponse as MechResponse;
}

export function matchHashtag(payload: MechPayload, hashtags: string[] | string) {
  // Ensure hashtags is always an array
  let hashtagsArray = Array.isArray(hashtags) ? hashtags : [hashtags];

  console.log("🎸 hashtagsArray", hashtagsArray);

  hashtagsArray = hashtagsArray.map((tag) => tag.toLowerCase());

  let payloadsPerHashtag = {} as any;
  let matchedPayloads: Piece[] = [];

  for (let item of payload) {
    if (item?.hashtags) {
      // Handle both string and array cases for hashtags property+
      let separatedHashtags = []
      if (Array.isArray(item.hashtags)) {
        separatedHashtags = item.hashtags.map((line) => line.replace(/\n/g, ""))
      } else if (typeof item.hashtags === 'string') {
        // Handle case where hashtags is a string
        separatedHashtags = item.hashtags.split(" ")
      }
      separatedHashtags.forEach((tag: string) => {
        let tagToUse = tag.replace(/\n/g, "").toLowerCase()
        payloadsPerHashtag[tagToUse] = item
      })
    }
  }

  console.log("🔥 payloadsPerHashtag", payloadsPerHashtag);

  for (let hashtag of hashtagsArray) {
    if (payloadsPerHashtag[hashtag]) {
      matchedPayloads.push(payloadsPerHashtag[hashtag]);
    }
  }

  console.log("matchedPayloads", matchedPayloads);

  // for (let eachHashtag of hashtagsArray) {
  //   // check if any item in payload has the current hashtag
  //   let matchedItems = payload.filter((item: Piece) => {
  //     // Handle case where hashtags is a string instead of array
  //     if (item?.hashtags) {
  //       // Handle both string and array cases for hashtags property
  //       if (Array.isArray(item.hashtags)) {
  //         let hashtagsJoined = item.hashtags.map((line) => line.replace(/\\n/g, "")).join(" ");
  //         return hashtagsJoined.split(" ").some((tag) => tag.trim() === eachHashtag.trim());
  //       } else if (typeof item.hashtags === 'string') {
  //         // Handle case where hashtags is a string
  //         return item.hashtags.trim() === eachHashtag.trim();
  //       }
  //     }
  //     // Explicitly return false if no hashtags property or no match
  //     return false;
  //   });

  //   if (matchedItems) {
  //     matchedPayloads.push(...matchedItems);
  //   }

  // }

  // let matchedPayload = payload.filter(Boolean).filter((item: Piece) => {
  //   // Handle case where hashtags is a string instead of array
  //   if (item?.hashtags) {
  //     // Handle both string and array cases for hashtags property
  //     if (Array.isArray(item.hashtags)) {
  //       let hashtagsJoined = item.hashtags.map((line) => line.replace(/\\n/g, "")).join(" ");
  //       console.log("hashtagsJoined", hashtagsJoined);
  //       return hashtagsJoined.split(" ").some((tag) => hashtagsArray.includes(tag.trim()));
  //     } else if (typeof item.hashtags === 'string') {
  //       // Handle case where hashtags is a string
  //       return hashtagsArray.includes(item.hashtags.trim());
  //     }
  //   }
  //   // Explicitly return false if no hashtags property or no match
  //   return false;
  // });


  let selectedPayload: Piece | undefined;
  console.log("matchedPayload", matchedPayloads)
  if (matchedPayloads.length > 0) {
    selectedPayload = matchedPayloads[0]
    console.log("selectedPayload", selectedPayload)
    for (let key in selectedPayload) {
      const value = selectedPayload[key];
      if (Array.isArray(value)) {
        selectedPayload[key] = selectRandomOne(value);
        // If last character is a line break, remove it
        if (typeof selectedPayload[key] === 'string' && selectedPayload[key]?.endsWith("\n")) {
          selectedPayload[key] = (selectedPayload[key] as string).slice(0, -1);
        }
      } else if (typeof value === 'string' && value.endsWith("\n")) {
        // Handle string case too
        selectedPayload[key] = value.slice(0, -1);
      }
    }
  }

  console.log("selectedPayload final:", selectedPayload)

  return selectedPayload as MechResponse;
}

if (require.main === module) {
  let mech = {
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
          "Prompt para ChatGPT:\n​\nHola, ChatGPT. Estoy buscando ayuda para crear una rutina de estudio de inglés para 1 hora, adaptada para un nivel A2. Me gustaría que incluyas actividades equilibradas que abarquen calentamiento, gramática, vocabulario, lectura, conversación y revisión. También quiero sugerencias de recursos o ejercicios específicos para cada parte de la rutina. ¡Gracias!\nSi quieres avanzar todos los días únete a mi club con esta promo limitada por hoy 👉\nhttps://curso.inglesconliza.com/club-de-ingles-con-liza/?utm_source=metameta&amp;utm_campaign=lettrythis\n"
        ]
      },
      {
        "hashtags": [
          "grupo\n"
        ],
        "comment": [
          "Revisa tus mensajes directos para más detalles.\n"
        ],
        "dm": [
          "Aquí tienes el enlace para unirte a mi grupo de WhatsApp: https://inglesconliza.com/comunidad\n¡Nos vemos ahí! 🚀\n"
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
          "¡Hola! 🤗 Te envío la guía en PDF de las \"10 Tips para hablar en Inglés\":\nAquí tienes el enlace: https://www.inglesconliza.com/pdf10tips solo tienes que poner tu correo electrónico y podrás descargarla.\nPromo limitada por 2 horas: https://curso.inglesconliza.com/club-de-ingles-con-liza/?utm_source=metameta&amp;utm_campaign=lettrythis\n¡Un abrazo! 💕\n"
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
          "¿Quieres recibir tips de inglés todos los días, practicar frases reales y mantenerte motivado?\n​\nÚnete gratis a mi comunidad en WhatsApp 📲\n✨ Progress, not perfection.\n​\nComunidad: https://inglesconliza.com/comunidad\n"
        ]
      },
      {
        "hashtags": [
          "Running\n"
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
          "🚨 ¡Últimos 4 días! ¿Listo/a para transformar tu inglés? Únete al Club y empieza hoy. 👇 ¡No lo dejes pasar!\nHAZ CLIC AQUÍ:  https://curso.inglesconliza.com/club-de-ingles-con-liza/?utm_source=metameta&amp;utm_campaign=lettrythis\n"
        ]
      },
      null,
      {
        "hashtags": "default",
        "comment": "Enviado por mensaje privado!",
        "dm": "¡Hola!  Aquí va tu guía que lo disfrutes.\nhttps://pronuncia.inglesconliza.com/\n​\n¡Promo flash solo por HOY!\n​\nHaz clic aquí:\nhttps://curso.inglesconliza.com/club-de-ingles-con-liza/\n​\n¡Abrazos!"
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
          "¡Hola! 🤗 Te envío mi audio guía gratuita: https://pronuncia.inglesconliza.com/20-restaurant\n¿Quieres mejorar tu inglés conmigo, te dejo esta promo limitada por 2 horas: https://curso.inglesconliza.com/club-de-ingles-con-liza/?utm_source=metameta&amp;utm_campaign=lettrythis\n¡Un abrazo! 💕\n"
        ]
      },
      null,
      {
        "end": [],
        "hashtags": [
          "guía guia\n"
        ],
        "comment": [
          "¡Tu guía va en camino! :wink:\n",
          "tus DMs! :sparkles:\n",
          "¡Te lo envió por privado! :relaxed:\n"
        ],
        "dm": [
          ":hugging_face: Aquí va tu guía que lo disfrutes.\nhttps://www.inglesconliza.com/guia\n:gift:¡Promo flash! por tiempo limitado por 2 horas: https://curso.inglesconliza.com/club-de-ingles-con-liza/?utm_source=metameta&amp;utm_campaign=lettrythis\n¡Abrazos! :sparkles::two_hearts:\n"
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
          "100\n",
          "cumple\n",
          "YES\n"
        ],
        "comment": [
          "Te lo envío al DM:sparkles:\n",
          "Revisa tus DMs:hugging_face:\n",
          "¡En camino!:gift:\n",
          "Te lo envío al DM:sparkles:\n",
          "Revisa tus DMs:hugging_face:\n",
          "¡En camino!:gift:\n",
          "¡Tu guía va en camino! :wink:\n",
          "tus DMs! :sparkles:\n",
          "¡Te lo envió por privado! :relaxed:\n"
        ],
        "dm": [
          "Hola ¡Aquí va tu regalo con 100 frases! https:wwwinglesconliza.com/pdf100frases\n:gift::sparkles: Promo flash: Por tiempo limitado por 2 horas: https:curso.inglesconliza.com/club-de-ingles-con-liza/?utm_source=metameta&amp;utm_campaign=lettrythis\n¡Abrazo!:sparkles:\n",
          "Hola, estoy feliz de cumplir años y celebrar 1 año desde el lanzamiento de nuestro club de inglés con Liza y ¡quiero celebrarlo contigo! Te espero en el club.\n:gift::sparkles: Promo flash: Por tiempo limitado por 2 horas: https:curso.inglesconliza.com/club-de-ingles-con-liza/\n",
          "¡YES! :hugging_face: Aquí va tu guía que lo disfrutes.\nhttps://www.inglesconliza.com/guia\n:gift:¡Promo flash! por tiempo limitado por 2 horas: https://curso.inglesconliza.com/club-de-ingles-con-liza/?utm_source=metameta&amp;utm_campaign=lettrythis\n¡Abrazos! :sparkles::two_hearts:\n"
        ],
        "End": []
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
          "Te espero en el club de inglés con Liza, ¡oferta única por 2 horas!\n​\n✅ Videos explicativos y dinámicos de manera diaria.\n✅ Quizzes interactivos.\n✅ Audios.\n✅ Contenido alineado al MCER.\n✅ Descarga de la clase del día en PDF.\n​\nUnete aquí 👉 https://curso.inglesconliza.com/club-de-ingles-con-liza/\n"
        ]
      },
      null
    ]
  }

  console.log(getResponseForHashtags(mech.json as MechPayload, "These are comments attached to an instagram post with this caption: Comenta AVANZAR y te envío algo especial. Solo por hoy \n\n#avanzar #inglés #inglesconliza #aprendeingles #inglesfacilerapido #inglesrapido"))
}