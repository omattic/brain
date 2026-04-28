CREATE TABLE IF NOT EXISTS instagram_response_profiles (
  profile TEXT PRIMARY KEY,
  payload TEXT NOT NULL,
  source TEXT,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS instagram_response_profile_comments (
  id TEXT PRIMARY KEY,
  profile TEXT NOT NULL,
  hashtag TEXT NOT NULL,
  value TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  priority INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL,
  source TEXT
);

CREATE INDEX IF NOT EXISTS idx_instagram_response_profile_comments_profile_hashtag_priority
  ON instagram_response_profile_comments (profile, hashtag, active, priority);

CREATE TABLE IF NOT EXISTS instagram_response_profile_dms (
  id TEXT PRIMARY KEY,
  profile TEXT NOT NULL,
  hashtag TEXT NOT NULL,
  value TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  priority INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL,
  source TEXT
);

CREATE INDEX IF NOT EXISTS idx_instagram_response_profile_dms_profile_hashtag_priority
  ON instagram_response_profile_dms (profile, hashtag, active, priority);

CREATE TABLE IF NOT EXISTS instagram_response_logs (
  id TEXT PRIMARY KEY,
  profile TEXT NOT NULL,
  matched_hashtag TEXT,
  rule_id TEXT,
  post_text TEXT,
  payload TEXT NOT NULL,
  recorded_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_instagram_response_logs_profile_recorded_at
  ON instagram_response_logs (profile, recorded_at DESC);

INSERT INTO instagram_response_profiles (profile, payload, source, updated_at)
VALUES (
  'inglesconliza',
  '{"profile":"inglesconliza","rules":[{"id":"components/slack/MECH.md#2","hashtags":["vip"],"comment":["Revisa tus mensajes directos para más detalles."],"dm":["💬 Únete al  n  VIP (cupos limitados): https://chat.whatsapp.com/KXLl2yZSOwZGbsOkgFW0Iq\nEnviaré regalos, tips diarios, ejercicios  y ofertas especiales! Exclusivo en el grupo, te espero"],"active":true,"priority":1},{"id":"components/slack/MECH.md#3","hashtags":["brunch"],"comment":["Revisa tus mensajes directos para más detalles."],"dm":["Para saber mas sobre el Brunch, entra al grupo de WhatsApp: https://inglesconliza.com/comunidad\n¡Nos vemos ahí! 🚀"],"active":true,"priority":2},{"id":"components/slack/MECH.md#4","hashtags":["tips"],"comment":["¡Gracias por comentar! Revisa tus DMs 💌"],"dm":["¡Hola! 🤗 Te envío la guía en PDF de las \"10 Tips para hablar en Inglés\":\nAquí tienes el enlace: https://www.inglesconliza.com/pdf10tips solo tienes que poner tu correo electrónico y podrás descargarla.\n💬 Únete al grupo VIP (cupos limitados): https://chat.whatsapp.com/GsZGSSrtWuQDhbhAVI5zXg"],"active":true,"priority":3},{"id":"components/slack/MECH.md#5","hashtags":["ebook"],"comment":["¡Enlace del ebook enviado por mensaje privado! 🚀","¡Te lo envié por privado!","Revisa tus DMs! 🚀"],"dm":["¡Hola! 🤗 Te envío el ebook en PDF de las \"10 Tips para hablar en Inglés\":\nAquí tienes el enlace: https://www.inglesconliza.com/pdf10tips solo tienes que poner tu correo electrónico y podrás descargarla.\n¿Necesitas avanzar y no sabes por donde comenzar? Escríbeme y te ayudo:\nhttps://wa.me/message/KVOXTS3RQ7KYC1\n¡Un abrazo! 💕"],"active":true,"priority":4},{"id":"components/slack/MECH.md#6","hashtags":["grupo"],"comment":["Te envié el enlace a la comunidad por mensaje directo ☺️","¡Te lo envié por privado!","Revisa tus DMs! 🚀"],"dm":["Únete gratis a mi comunidad en WhatsApp 📲\nhttps://chat.whatsapp.com/JjXPtJlvOnF6p5eJ5z547Q"],"active":true,"priority":5},{"id":"components/slack/MECH.md#7","hashtags":["mentoría"],"comment":["Te envié el enlace a la comunidad por mensaje directo ☺️","¡Te lo envié por privado!","Revisa tus DMs! 🚀"],"dm":["¡Qué emoción que te interese la mentoría! 💬\n Completa este formulario y te escribo para agendar una llamada:\n 👉 https://forms.gle/BL6BiLzD63uDXCga9"],"active":true,"priority":6},{"id":"components/slack/MECH.md#8","hashtags":["mentoria"],"comment":["Te envié el enlace a la comunidad por mensaje directo ☺️","¡Te lo envié por privado!","Revisa tus DMs! 🚀"],"dm":["¡Qué emoción que te interese la mentoría! 💬\n Completa este formulario y te escribo para agendar una llamada:\n 👉 https://forms.gle/BL6BiLzD63uDXCga9"],"active":true,"priority":7},{"id":"components/slack/MECH.md#9","hashtags":["running"],"comment":["Te envié el enlace a la comunidad por mensaje directo ☺️","Check your DMs! 💕","Revisa tus comentarios!","Enviado por mensaje privado!"],"dm":["¿Quieres recibir tips de inglés todos los días, practicar frases reales y mantenerte motivado/a? Únete gratis a mi comunidad en WhatsApp 📲 Es contenido útil, rápido y directo a tu celular.\n✨ Progress, not perfection.\nComunidad: https://inglesconliza.com/comunidad"],"active":true,"priority":8},{"id":"components/slack/MECH.md#10","hashtags":["club"],"comment":["Te envié el enlace por mensaje directo ☺️","Check your DMs! 💕","Enviado por mensaje privado!","Revisa tus comentarios!"],"dm":["Puedes  comenzar tu transformacion hoy, inscríbete aquí 👉\nhttps://curso.inglesconliza.com/club-de-ingles-promo/\n ¡No lo dejes pasar solo por 24! ✅"],"active":true,"priority":9},{"id":"components/slack/MECH.md#11","hashtags":["default"],"comment":["Te envié la respuesta por mensaje directo ☺️","Check your DMs! 💕","Revisa tus comentarios!","Enviado por mensaje privado!"],"dm":["Comunidad: https://inglesconliza.com/comunidad\n¿Necesitas mejorar tu speaking?\nTe tengo la solución, escríbeme por WhatsApp.\n  Escribir a Liza 👉 https://wa.me/message/KVOXTS3RQ7KYC1\nAvancemos juntos 👉\n¡ A mejorar tu inglés!"],"active":true,"priority":10},{"id":"components/slack/MECH.md#12","hashtags":["restaurante"],"comment":["¡Enlace del ebook enviado por mensaje privado! 🚀","¡Te lo envié por privado!","Revisa tus DMs! 🚀"],"dm":["¡Hola! 🤗\n Te envío mi audio guía gratuita:\nhttps://pronuncia.inglesconliza.com/20-restaurant\nClub de inglés — crea tu hábito diario conmigo.\n👉 https://curso.inglesconliza.com/club-de-ingles-con-liza/\n¡Un abrazo! 💕"],"active":true,"priority":11},{"id":"components/slack/MECH.md#13","hashtags":["ebook"],"comment":["¡Tu guía va en camino! :wink:","Revisa tus DMs! :sparkles:","¡Te lo envió por privado! :relaxed:"],"dm":["😊 Aquí va tu guía que lo disfrutes.\nhttps://www.inglesconliza.com/guia\nComienza a perder el miedo hoy mismo 👉  https://curso.inglesconliza.com/club-de-ingles-con-liza/"],"active":true,"priority":12},{"id":"components/slack/MECH.md#14","hashtags":["50"],"comment":["Revisa tus DMs:sparkles:","¡Te lo envío por privado!:smiling_face_with_3_hearts:","¡Tus frases van en camino!:wink:"],"dm":["¡Hola! Aquí van tus 50 Frases :blush:\nhttps:www.inglesconliza.com/pdf100frases\n:gift: Promo flash! por tiempo limitado por 2 horas: https://curso.inglesconliza.com/club-de-ingles-con-liza/?utm_source=metameta&utm_campaign=lettrythis\n¡Abrazo!:sparkles::hugging_face:"],"active":true,"priority":13},{"id":"components/slack/MECH.md#15","hashtags":["100"],"comment":["Te lo envío al DM:sparkles:","Revisa tus DMs:hugging_face:","¡En camino!:gift:"],"dm":["¡Aquí va tu regalo con 100 frases!\nhttps://inglesconliza.com/pdf100frases\n💬 Únete al grupo VIP (cupos limitados): https://chat.whatsapp.com/GsZGSSrtWuQDhbhAVI5zXg\n¡Un abrazo!"],"active":true,"priority":14},{"id":"components/slack/MECH.md#16","hashtags":["cumple"],"comment":["Te lo envío al DM:sparkles:","Revisa tus DMs:hugging_face:","¡En camino! :gift:"],"dm":["Hola, estoy feliz de cumplir años y celebrar 1 año desde el lanzamiento de nuestro club de inglés con Liza y ¡quiero celebrarlo contigo! Te espero en el club.\n:gift::sparkles: Promo flash: Por tiempo limitado por 2 horas:\nhttps://curso.inglesconliza.com/club-de-ingles-con-liza/"],"active":true,"priority":15},{"id":"components/slack/MECH.md#17","hashtags":["yess"],"comment":["¡Tu guía va en camino! :wink:","Revisa tus DMs! :sparkles:","¡Te lo envió por privado! :relaxed:"],"dm":["¡YES! :hugging_face: Aquí va tu guía que lo disfrutes.\nhttps://www.inglesconliza.com/guia\n:gift:¡Promo flash! por tiempo limitado por 2 horas: https://curso.inglesconliza.com/club-de-ingles-con-liza/?utm_source=metameta&utm_campaign=lettrythis\n¡Abrazos! :sparkles::two_hearts:"],"active":true,"priority":16},{"id":"components/slack/MECH.md#18","hashtags":["guide"],"comment":["¡Tu guía va en camino! :wink:","Revisa tus DMs! :sparkles:","¡Te lo envió por privado! :relaxed:"],"dm":["Hola, ¿cómo estás?  Aquí va tu guía que lo disfrutes.\nhttps://pronuncia.inglesconliza.com\n¡Promo flash solo por HOY!  Haz clic aquí 👉 https://curso.inglesconliza.com/club-de-ingles-con-liza/?utm_source=metameta&utm_campaign=lettrythis\n¡Abrazos!"],"active":true,"priority":17},{"id":"components/slack/MECH.md#19","hashtags":["avanzar"],"comment":["¡Tu guía va en camino!","Revisa tus DMs!","¡Te lo envió por privado!"],"dm":["¿Sientes que necesitas mejorar tu inglés pero no sabes por dónde empezar? 💬\n Comienza a crear tu hábito hoy, oferta flash por 2 horas  👉 https://curso.inglesconliza.com/club-de-ingles-promo/\nTe espero 🙌🎉"],"active":true,"priority":18},{"id":"components/slack/MECH.md#20","hashtags":["rutina"],"comment":["¡Tu guía va en camino! :wink:","Revisa tus DMs! :sparkles:","¡Te lo envió por privado! :relaxed:"],"dm":["Prompt listo para usar en ChaGPT:\nActúa como un profesor de inglés especializado en estudiantes de nivel A2. Ayúdame a crear una rutina de estudio semanal para mejorar mi inglés en las 5 habilidades: listening, speaking, reading, writing y grammar. Quiero estudiar 5 días a la semana durante 30 a 60 minutos al día. Divide la rutina por días, sugiere actividades concretas, recursos gratuitos online (como videos, canciones, ejercicios interactivos), y finaliza cada día con una pequeña evaluación o repaso.\n💬 Únete al grupo VIP de Black Friday (cupos limitados): https://chat.whatsapp.com/KXLl2yZSOwZGbsOkgFW0Iq\nEnviaré regalos, tips diarios, ejercicios a partir del 17 de noviembre! Exclusivo en el grupo, te espero"],"active":true,"priority":19},{"id":"components/slack/MECH.md#21","hashtags":["tesst"],"comment":["¡Gracias por comentar! Revisa tus DMs 💌"],"dm":["¡Hola! 👋\nLa respuesta correcta es:\n✅ settled down que significa asentarse.\n🙌 Es un phrasal verb muy usado.\n¿Quieres seguir avanzando con una estructura clara todos los días? 🗓️\nÚnete a mi club de inglés y comenzamos: https://curso.inglesconliza.com/club-de-ingles-con-liza/\n¡Un abrazo! 💕"],"active":true,"priority":20},{"id":"components/slack/MECH.md#22","hashtags":["secreto"],"comment":["¡Tu envié algo! :wink:","Revisa tus DMs! :sparkles:","¡Te lo envió por privado! :relaxed:"],"dm":["¿Sientes que necesitas mejorar tu inglés pero no sabes por dónde empezar? 💬\n 📌 Club de Inglés con contenido diario, fácil y práctico\nOferta flash solo por este mensaje.\n$19 en vez de $114 👉  https://curso.inglesconliza.com/club-de-ingles-promo/"],"active":true,"priority":21},{"id":"components/slack/MECH.md#23","hashtags":["quiero"],"comment":["¡Tu envié algo! :wink:","Revisa tus DMs! :sparkles:","¡Te lo envió por privado! :relaxed:"],"dm":["💬 Únete al grupo VIP https://chat.whatsapp.com/KXLl2yZSOwZGbsOkgFW0Iq"],"active":true,"priority":22},{"id":"components/slack/MECH.md#24","hashtags":["speaking"],"comment":["¡Tu envié algo! :wink:","Revisa tus DMs! :sparkles:","¡Te lo envió por privado! :relaxed:"],"dm":["¿Te gustaría mejorar tu speaking y destacarte en tu trabajo por tu profesionalismo y fluidez? 💬\nEscríbeme por WhatsApp y te ayudo a encontrar el mejor camino para avanzar:\n👉 https://wa.me/message/KVOXTS3RQ7KYC1"],"active":true,"priority":23},{"id":"components/slack/MECH.md#25","hashtags":["guia"],"comment":["¡Tu envié algo! :wink:","Revisa tus DMs! :sparkles:","¡Te lo envió por privado! :relaxed:"],"dm":["Descarga la guía aquí: https://www.inglesconliza.com/guia\n💬 Únete al grupo VIP de Black Friday (cupos limitados): https://chat.whatsapp.com/KXLl2yZSOwZGbsOkgFW0Iq\nEnviaré regalos, tips diarios, ejercicios a partir del 20 de noviembre! Exclusivo en el grupo, te espero"],"active":true,"priority":24},{"id":"components/slack/MECH.md#26","hashtags":["nativo"],"comment":["¡Tu envié algo! :wink:","Revisa tus DMs! :sparkles:","¡Te lo envió por privado! :relaxed:"],"dm":["Si necesitas mejorar tu inglés y no quieres perder más tiempo, te espero en mi grupo gratuito de WhatsApp.\nAllí publico tips diarios y cuento sobre las herramientas que tengo para que puedas avanzar rápido 💨\n💬 Únete acá, cupos limitados 👉 https://chat.whatsapp.com/KXLl2yZSOwZGbsOkgFW0Iq"],"active":true,"priority":25},{"id":"components/slack/MECH.md#27","hashtags":["canal"],"comment":["¡Tu envié algo! :wink:","Revisa tus DMs! :sparkles:","¡Te lo envió por privado! :relaxed:"],"dm":["¡Gracias por comentar!\n🎯 Aquí te dejo el link para unirte a mi Canal exclusivo de Telegram, donde comparto tips, frases útiles y contenido para hablar inglés con más seguridad:\n 👉 https://t.me/inglesconliza"],"active":true,"priority":26},{"id":"components/slack/MECH.md#28","hashtags":["go"],"comment":["¡Tu envié algo! :wink:","Revisa tus DMs! :sparkles:","¡Te lo envió por privado! :relaxed:"],"dm":["🙌 ¡Gracias por estar en el live!\n🚨 Solo HOY oferta especial:\n💬 Escríbeme YA 👇\nhttps://wa.me/message/KVOXTS3RQ7KYC1"],"active":true,"priority":27},{"id":"components/slack/MECH.md#29","hashtags":["gratis"],"comment":["¡Tu envié algo! :wink:","Revisa tus DMs! :sparkles:","¡Te lo envió por privado! :relaxed:"],"dm":["Únete a mi canal de Telegram: https://t.me/inglesconliza\n  ¿Sientes que necesitas mejorar tu inglés pero no sabes por dónde empezar? 💬\nEscríbeme por WhatsApp y te ayudo a encontrar el mejor camino para avanzar:\n Escribir a Liza 👉 https://wa.me/message/KVOXTS3RQ7KYC1"],"active":true,"priority":28},{"id":"components/slack/MECH.md#30","hashtags":["start"],"comment":["Revisa tus DMs:sparkles:","¡Te lo envío por privado!:smiling_face_with_3_hearts:","¡Algo va en camino!:wink:"],"dm":["¡La PROMO FLASH está activa solo hasta mañana:\n✅ Precio exclusivo: $19.38/ al mes en vez de $114\n✅ Acceso inmediato al Club de Inglés con Liza\n👉 Inscríbete aquí: https://curso.inglesconliza.com/club-de-ingles-promo/"],"active":true,"priority":29},{"id":"components/slack/MECH.md#31","hashtags":["webinar"],"comment":["¡Tu envié algo! :wink:","Revisa tus DMs! :sparkles:","¡Te lo envió por privado! :relaxed:"],"dm":["¿Sientes que necesitas mejorar tu inglés pero no sabes por dónde empezar? 💬\nTe espero en mi webinar gratuito Destraba tu inglés 💬 este 09 de octubre.\nInscríbete aquí: https://forms.gle/vddsKhDfjkVDpoFW7\n Grupo de WhatsApp 👉 https://chat.whatsapp.com/FsRBfyPWiNNGQheGHeum5c"],"active":true,"priority":30},{"id":"components/slack/MECH.md#32","hashtags":["flash"],"comment":["Revisa tus DMs:sparkles:","¡Te lo envío por privado!:smiling_face_with_3_hearts:","¡Algo va en camino!:wink:"],"dm":["🔥 PROMO FLASH ACTIVADA:\n ✅ Club + 2 clases Speaking: $99/mes (antes $399)\n ⏰ Solo hasta mañana a medianoche\n👉 Escríbeme aquí para inscribirte:\nhttps://wa.me/message/KVOXTS3RQ7KYC1"],"active":true,"priority":31},{"id":"components/slack/MECH.md#33","hashtags":["vocabulario"],"comment":["¡Gracias por comentar! Revisa tus DMs 💌","¡Gracias por comentar! Revisa tus DMs 💌"],"dm":["¡Hola! 👋 Liza acaba de lanzar una súper promo en un Live 🙌\nTe paso los detalles de la promo especial de hoy 🎁:\n✅ 3 eBooks de vocabulario práctico: Aeropuerto, Restaurante y Médico\n✅ Audioguías con pronunciación profesional\n✅ Traducción y ejemplos reales para que los uses desde el primer día\n💰 Solo $49 (antes $149)\nPuedes hacer el pago directo aquí 👉 https://buy.stripe.com/cNiaEX55q1rTcdU37C2Nq08"],"active":true,"priority":32},{"id":"components/slack/MECH.md#34","hashtags":["hoy"],"comment":["¡Tu envié algo! :wink:","Revisa tus DMs! :sparkles:","¡Te lo envió por privado! :relaxed:"],"dm":["Únete a mi canal de Telegram: https://t.me/inglesconliza\n  ¿Sientes que necesitas mejorar tu inglés pero no sabes por dónde empezar? 💬\nEscríbeme por WhatsApp y te ayudo a encontrar el mejor camino para avanzar:\n Escribir a Liza 👉 https://wa.me/message/KVOXTS3RQ7KYC1"],"active":true,"priority":33},{"id":"components/slack/MECH.md#35","hashtags":["clases"],"comment":["¡Tu envié algo! :wink:","Revisa tus DMs! :sparkles:","¡Te lo envió por privado! :relaxed:"],"dm":["💥 Estás viendo el live = tienes 80% OFF\nNo lo dejes pasar\nHaz clic en el link: https://curso.inglesconliza.com/club-de-ingles-promo/"],"active":true,"priority":34},{"id":"components/slack/MECH.md#36","hashtags":["comunidad"],"comment":["Te envié la respuesta por mensaje directo ☺️","Check your DMs! 💕","Revisa tus comentarios!","Enviado por mensaje privado!"],"dm":["Te espero en mi comunidad para más tips: https://chat.whatsapp.com/JQaBKDqVijE6A6FzVs8Rn9\nLet''s improve your English together!"],"active":true,"priority":35},{"id":"components/slack/MECH.md#37","hashtags":["yes"],"comment":["Te envié la respuesta por mensaje directo ☺️","Check your DMs! 💕","Revisa tus comentarios!","Enviado por mensaje privado!"],"dm":["💬 Únete al grupo VIP de Black Friday (cupos limitados): https://chat.whatsapp.com/FsRBfyPWiNNGQheGHeum5c\nEnviaré regalos, tips diarios, ejercicios a partir del 20 de noviembre! Exclusivo en el grupo, te espero"],"active":true,"priority":36},{"id":"components/slack/MECH.md#38","hashtags":["lunes"],"comment":["Te envié la respuesta por mensaje directo ☺️","Check your DMs! 💕","Revisa tus comentarios!","Enviado por mensaje privado!"],"dm":["💬 Únete al grupo VIP de Black Friday (cupos limitados): https://chat.whatsapp.com/KXLl2yZSOwZGbsOkgFW0Iq\nEnviaré regalos, tips diarios, ejercicios a partir del 17 de noviembre! Exclusivo en el grupo, te espero"],"active":true,"priority":37},{"id":"components/slack/MECH.md#39","hashtags":["black"],"comment":["Te envié la respuesta por mensaje directo ☺️","Check your DMs! 💕","Revisa tus comentarios!","Enviado por mensaje privado!"],"dm":["Últimas dos horas!! 🔥 Mejora tu inglés con 75% de descuento solo estos días: https://curso.inglesconliza.com/black-friday-3/\n💬  Te atiendo personalmente: https://wa.me/message/KVOXTS3RQ7KYC1"],"active":true,"priority":38},{"id":"components/slack/MECH.md#40","hashtags":["test"],"comment":["Te envié la respuesta por mensaje directo ☺️","Check your DMs! 💕","Revisa tus comentarios!","Enviado por mensaje privado!"],"dm":["Te dejo el test aqui: https://www.inglesconliza.com/nivelacion\n 💬 Únete al grupo VIP (cupos limitados): https://chat.whatsapp.com/KXLl2yZSOwZGbsOkgFW0Iq"],"active":true,"priority":39},{"id":"components/slack/MECH.md#41","hashtags":["start"],"comment":["Te envié la respuesta por mensaje directo ☺️","Check your DMs! 💕","Revisa tus comentarios!","Enviado por mensaje privado!"],"dm":["💬 ¿No sabes tu nivel de inglés? Te atiendo personalmente: https://wa.me/message/KVOXTS3RQ7KYC1"],"active":true,"priority":40},{"id":"components/slack/MECH.md#42","hashtags":["dishes"],"comment":["Te envié la respuesta por mensaje directo ☺️","Check your DMs! 💕","Revisa tus comentarios!","Enviado por mensaje privado!"],"dm":["Se dice: I’m doing the dishes\n💬 ¿Necesitas mejorar tu inglés diariamente? Te espero en mi club: https://curso.inglesconliza.com/club-de-ingles-promo/"],"active":true,"priority":41},{"id":"components/slack/MECH.md#43","hashtags":["clases"],"comment":["Te envié la respuesta por mensaje directo ☺️","Check your DMs! 💕","Revisa tus comentarios!","Enviado por mensaje privado!"],"dm":["💥 Estás viendo el live = tienes 80% OFF\nNo lo dejes pasar 👉\nhttps://curso.inglesconliza.com/club-de-ingles-promo/"],"active":true,"priority":42},{"id":"components/slack/MECH.md#44","hashtags":["money"],"comment":["Te envié la respuesta por mensaje directo ☺️","Check your DMs! 💕","Revisa tus comentarios!","Enviado por mensaje privado!"],"dm":["Let''s count our cash!\n💥 Estás viendo el live = tienes 80% OFF\nNo lo dejes pasar 👉\nhttps://curso.inglesconliza.com/club-de-ingles-promo/"],"active":true,"priority":43},{"id":"components/slack/MECH.md#45","hashtags":["25"],"comment":["Te envié la respuesta por mensaje directo ☺️","Check your DMs! 💕","Revisa tus comentarios!","Enviado por mensaje privado!"],"dm":["Aquí tienes 25 conectores comunes en inglés, clasificados por su función. Para ayudarte a estructurar tus ideas: And (y), But (pero), However (sin embargo), Moreover/Furthermore (además), Therefore/So (por lo tanto/entonces), Because/Since (porque/puesto que), In addition to (además de), On the other hand (por otro lado), First/Firstly (en primer lugar), Finally/Lastly (finalmente), In conclusion (en conclusión), For example (por ejemplo), Also (también), Although/Even though (aunque), Due to (debido a), In order to (para), As a result (como resultado), Meanwhile (mientras tanto), Nevertheless (no obstante), Instead (en lugar de), Also (también), In fact (de hecho), For instance (por ejemplo), To summarize (para resumir), y Meanwhile (mientras tanto) para dar fluidez a tu discurso.\n 80% OFF en mi club de inglés!\nNo lo dejes pasar 👉\nhttps://curso.inglesconliza.com/club-de-ingles-promo/"],"active":true,"priority":44},{"id":"components/slack/MECH.md#46","hashtags":["casco"],"comment":["Revisa tus mensajes directos para más detalles.","Te envié la respuesta por mensaje directo ☺️","Check your DMs! 💕","Revisa tus comentarios!","Enviado por mensaje privado!"],"dm":["Se dice: I''m putting on my helmet\n💬 Únete al grupo VIP (cupos limitados): https://chat.whatsapp.com/KXLl2yZSOwZGbsOkgFW0Iq\nEnviaré regalos, tips diarios, ejercicios  y ofertas especiales! Exclusivo en el grupo, te espero"],"active":true,"priority":45},{"id":"components/slack/MECH.md#47","hashtags":["cuando"],"comment":["Revisa tus mensajes directos para más detalles."],"dm":["Se dice: Whenever you feel like it\n💬 Únete al grupo VIP (cupos limitados): https://chat.whatsapp.com/JVfmgv9UNGoLAOgCNEAUOM\nEnvío tips diarios, ejercicios  y ofertas especiales! Exclusivo en el grupo, te espero"],"active":true,"priority":46},{"id":"components/slack/MECH.md#48","hashtags":["lista"],"comment":["Revisa tus mensajes directos para más detalles.","Te envié la respuesta por mensaje directo ☺️","Check your DMs! 💕","Revisa tus comentarios!","Enviado por mensaje privado!"],"dm":["Lista completa:\n1. Agrio - Sour\n2. Dulce - Sweet\n3. Salado - Savory\n4. Amargo - Bitter\n5. Umami - Umami\n6. Picante - Spicy\n7. Fresco - Fresh\n8. Levemente dulce - Mildly Sweet\n9. Intenso - Intense\n10. Ácido - Acidic\n💬 Únete al grupo VIP (cupos limitados): https://chat.whatsapp.com/JVfmgv9UNGoLAOgCNEAUOM\nEnvío tips diarios, ejercicios  y ofertas especiales! Exclusivo en el grupo, te espero"],"active":true,"priority":47},{"id":"components/slack/MECH.md#49","hashtags":["lentes"],"comment":["Revisa tus mensajes directos para más detalles.","Te envié la respuesta por mensaje directo ☺️","Check your DMs! 💕"],"dm":["Se dice: I’m putting on my glasses and I’m taking them off.\n💬 Únete al grupo VIP (cupos limitados): https://chat.whatsapp.com/JVfmgv9UNGoLAOgCNEAUOM\nEnvío tips diarios, ejercicios  y ofertas especiales! Exclusivo en el grupo, te espero"],"active":true,"priority":48},{"id":"components/slack/MECH.md#50","hashtags":["workout"],"comment":["Revisa tus mensajes directos para más detalles.","Te envié la respuesta por mensaje directo ☺️","Check your DMs! 💕"],"dm":["Se dice: I enjoy/like working out 🏋️\n💬 Únete al grupo VIP (cupos limitados): https://chat.whatsapp.com/JVfmgv9UNGoLAOgCNEAUOM\nEnvío tips diarios, ejercicios  y ofertas especiales! Exclusivo en el grupo, te espero"],"active":true,"priority":49},{"id":"components/slack/MECH.md#51","hashtags":["por"],"comment":["Revisa tus mensajes directos para más detalles.","Te envié la respuesta por mensaje directo ☺️","Check your DMs! 💕"],"dm":["La expresión \"por eso\" en inglés se traduce como \"that''s why.\" Aquí tienes dos ejemplos:\n1. Estoy cansado, por eso no puedo salir.\n I’m tired, that’s why I can’t go out.\n2. Ella estudió mucho, por eso aprobó el examen.\n She studied a lot, that’s why she passed the exam.\n💬 Únete al grupo VIP (cupos limitados):\nhttps://chat.whatsapp.com/GsZGSSrtWuQDhbhAVI5zXg\nEnvío tips diarios, ejercicios  y ofertas especiales! Exclusivo en el grupo, te espero"],"active":true,"priority":50},{"id":"components/slack/MECH.md#52","hashtags":["mio"],"comment":["Revisa tus mensajes directos para más detalles.","Te envié la respuesta por mensaje directo ☺️","Check your DMs! 💕"],"dm":["Se puede decir: It slipped my mind!\nI totally forgot\n💬 Únete al grupo VIP (cupos limitados):\nhttps://chat.whatsapp.com/KvqzW7uYEHd44JMqk9c2Dq?mode=gi_t\nEnvío tips diarios, ejercicios  y ofertas especiales! Exclusivo en el grupo, te espero"],"active":true,"priority":51},{"id":"components/slack/MECH.md#53","hashtags":["entrevista"],"comment":["Te envié la respuesta por mensaje directo ☺️","Check your DMs! 💕","Revisa tus comentarios!","Enviado por mensaje privado!"],"dm":["💬 Te espero en mi grupo para profesionales: https://chat.whatsapp.com/HqMZW1PZXGMC5g4cDPYzzH"],"active":true,"priority":52},{"id":"components/slack/MECH.md#54","hashtags":["profesionales"],"comment":["Te envié la respuesta por mensaje directo ☺️","Check your DMs! 💕","Revisa tus comentarios!","Enviado por mensaje privado!"],"dm":["💬 Te espero en mi grupo para profesionales: https://chat.whatsapp.com/HqMZW1PZXGMC5g4cDPYzzH"],"active":true,"priority":53},{"id":"components/slack/MECH.md#55","hashtags":["tanto"],"comment":["Revisa tus mensajes directos para más detalles.","Te envié la respuesta por mensaje directo ☺️","Check your DMs! 💕"],"dm":["Se puede decir:  I’ll keep you posted\n💬 Únete al grupo VIP (cupos limitados):\nhttps://chat.whatsapp.com/KvqzW7uYEHd44JMqk9c2Dq?mode=gi_t\nEnvío tips diarios, ejercicios  y ofertas especiales! Exclusivo en el grupo, te espero"],"active":true,"priority":54},{"id":"components/slack/MECH.md#56","hashtags":["terminar"],"comment":["Revisa tus mensajes directos para más detalles.","Te envié la respuesta por mensaje directo ☺️","Check your DMs! 💕"],"dm":["Se puede decir: Let’s call it a day!\n💬 Únete al grupo VIP (cupos limitados):\nhttps://chat.whatsapp.com/KvqzW7uYEHd44JMqk9c2Dq?mode=gi_t\nEnvío tips diarios, ejercicios  y ofertas especiales! Exclusivo en el grupo, te espero"],"active":true,"priority":55},{"id":"components/slack/MECH.md#57","hashtags":["creo"],"comment":["Te envié la respuesta por mensaje directo ☺️","Check your DMs! 💕","Revisa tus comentarios!","Enviado por mensaje privado!"],"dm":["💬 una de las respuestas es: I don’t but it\n  Te espero en mi comunidad para más tips: https://chat.whatsapp.com/KXLl2yZSOwZGbsOkgFW0Iq\nLet''s improve your English together!"],"active":true,"priority":56},{"id":"components/slack/MECH.md#58","hashtags":["10"],"comment":["Te lo envío al DM:sparkles:","Revisa tus DMs:hugging_face:","¡En camino!:gift:"],"dm":["¡Aquí va tu regalo mi ebook con los 10 tips para mejorar tu inglés!\nhttps://www.inglesconliza.com/pdf10tips\n💬 Únete al grupo VIP (cupos limitados): https://chat.whatsapp.com/GsZGSSrtWuQDhbhAVI5zXg\n¡Un abrazo!"],"active":true,"priority":57},{"id":"components/slack/MECH.md#59","hashtags":["siempre"],"comment":["Te envié la respuesta por mensaje directo ☺️","Check your DMs! 💕","Revisa tus comentarios!","Enviado por mensaje privado!"],"dm":["💬 una de las respuestas es: Same old!\n  Te espero en mi comunidad para más tips: https://chat.whatsapp.com/KXLl2yZSOwZGbsOkgFW0Iq\nLet''s improve your English together!"],"active":true,"priority":58},{"id":"components/slack/MECH.md#60","hashtags":["tea"],"comment":["Te envié la respuesta por mensaje directo ☺️","Check your DMs! 💕","Revisa tus comentarios!","Enviado por mensaje privado!"],"dm":["💬 una de las respuestas es: I''m pouring myself a cup of tea!\n Te espero en mi grupo para más tips, cupos limitados: https://chat.whatsapp.com/FsRBfyPWiNNGQheGHeum5c"],"active":true,"priority":59},{"id":"components/slack/MECH.md#61","hashtags":["earphones"],"comment":["Te envié la respuesta por mensaje directo ☺️","Check your DMs! 💕","Revisa tus comentarios!","Enviado por mensaje privado!"],"dm":["Se dice: I''m putting on my earphones.\nTe espero en mi grupo para más tips, cupos limitados:  https://chat.whatsapp.com/KXLl2yZSOwZGbsOkgFW0Iq"],"active":true,"priority":60},{"id":"components/slack/MECH.md#62","hashtags":["water"],"comment":["Te envié la respuesta por mensaje directo ☺️","Check your DMs! 💕","Revisa tus comentarios!","Enviado por mensaje privado!"],"dm":["💬 una de las respuestas es: I ran out of water!\n Te espero en mi grupo para más tips, cupos limitados: https://chat.whatsapp.com/FsRBfyPWiNNGQheGHeum5c"],"active":true,"priority":61},{"id":"components/slack/MECH.md#63","hashtags":["time"],"comment":["Te envié la respuesta por mensaje directo ☺️","Check your DMs! 💕","Revisa tus comentarios!","Enviado por mensaje privado!"],"dm":["💬 una de las respuestas es: I’m running out of time!\n Te espero en mi grupo para más tips, cupos limitados: https://chat.whatsapp.com/FsRBfyPWiNNGQheGHeum5c"],"active":true,"priority":62},{"id":"components/slack/MECH.md#64","hashtags":["song"],"comment":["Te envié la respuesta por mensaje directo ☺️","Check your DMs! 💕","Revisa tus comentarios!","Enviado por mensaje privado!"],"dm":["Descarga la guía aquí: https://drive.google.com/file/d/1HAp55yt48d7t3zxDTwgNVTcoyKX4SNPQ/view?usp=drive_link\nIscríbete al evento Singlish Sessions en Asunción: 📲https://wa.me/message/KVOXTS3RQ7KYC1"],"active":true,"priority":63},{"id":"components/slack/MECH.md#65","hashtags":["musica"],"comment":["Te envié la respuesta por mensaje directo ☺️","Check your DMs! 💕","Revisa tus comentarios!","Enviado por mensaje privado!"],"dm":["Únete al grupo: https://chat.whatsapp.com/JIX2WX5IUfBF5a1NjFlJ5T?mode=gi_t\nIscríbete al evento Singlish Sessions en Asunción: 📲https://wa.me/message/KVOXTS3RQ7KYC1"],"active":true,"priority":64},{"id":"components/slack/MECH.md#66","hashtags":["c1"],"comment":["Te envié la respuesta por mensaje directo ☺️","Check your DMs! 💕","Revisa tus comentarios!","Enviado por mensaje privado!"],"dm":["Se puede decir: Like father, like son.\nÚnete  a mi grupo de WhatsApp, cupos limitados:\nhttps://chat.whatsapp.com/FsRBfyPWiNNGQheGHeum5c"],"active":true,"priority":65},{"id":"components/slack/MECH.md#67","hashtags":["escalera"],"comment":["Te envié la respuesta por mensaje directo ☺️","Check your DMs! 💕","Revisa tus comentarios!","Enviado por mensaje privado!"],"dm":["💬 una de las respuestas es: I’m going down the stairs\n Te espero en mi grupo para más tips, cupos limitados: https://chat.whatsapp.com/FsRBfyPWiNNGQheGHeum5c"],"active":true,"priority":66}],"updatedAt":"2026-04-28T16:57:02.161Z","source":"components/slack/MECH.md"}',
  'components/slack/MECH.md',
  '2026-04-28T16:57:02.161Z'
)
ON CONFLICT(profile) DO UPDATE SET
  payload = excluded.payload,
  source = excluded.source,
  updated_at = excluded.updated_at;

DELETE FROM instagram_response_profile_comments
WHERE profile = 'inglesconliza';

DELETE FROM instagram_response_profile_dms
WHERE profile = 'inglesconliza';

INSERT INTO instagram_response_profile_comments (
  id, profile, hashtag, value, active, priority, updated_at, source
)
VALUES
(
  'inglesconliza:vip:comment:1:0',
  'inglesconliza',
  'vip',
  'Revisa tus mensajes directos para más detalles.',
  1,
  1,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:brunch:comment:2:0',
  'inglesconliza',
  'brunch',
  'Revisa tus mensajes directos para más detalles.',
  1,
  2,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:tips:comment:3:0',
  'inglesconliza',
  'tips',
  '¡Gracias por comentar! Revisa tus DMs 💌',
  1,
  3,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:ebook:comment:4:0',
  'inglesconliza',
  'ebook',
  '¡Enlace del ebook enviado por mensaje privado! 🚀',
  1,
  4,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:ebook:comment:4:1',
  'inglesconliza',
  'ebook',
  '¡Te lo envié por privado!',
  1,
  4,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:ebook:comment:4:2',
  'inglesconliza',
  'ebook',
  'Revisa tus DMs! 🚀',
  1,
  4,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:grupo:comment:5:0',
  'inglesconliza',
  'grupo',
  'Te envié el enlace a la comunidad por mensaje directo ☺️',
  1,
  5,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:grupo:comment:5:1',
  'inglesconliza',
  'grupo',
  '¡Te lo envié por privado!',
  1,
  5,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:grupo:comment:5:2',
  'inglesconliza',
  'grupo',
  'Revisa tus DMs! 🚀',
  1,
  5,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:mentoría:comment:6:0',
  'inglesconliza',
  'mentoría',
  'Te envié el enlace a la comunidad por mensaje directo ☺️',
  1,
  6,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:mentoría:comment:6:1',
  'inglesconliza',
  'mentoría',
  '¡Te lo envié por privado!',
  1,
  6,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:mentoría:comment:6:2',
  'inglesconliza',
  'mentoría',
  'Revisa tus DMs! 🚀',
  1,
  6,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:mentoria:comment:7:0',
  'inglesconliza',
  'mentoria',
  'Te envié el enlace a la comunidad por mensaje directo ☺️',
  1,
  7,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:mentoria:comment:7:1',
  'inglesconliza',
  'mentoria',
  '¡Te lo envié por privado!',
  1,
  7,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:mentoria:comment:7:2',
  'inglesconliza',
  'mentoria',
  'Revisa tus DMs! 🚀',
  1,
  7,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:running:comment:8:0',
  'inglesconliza',
  'running',
  'Te envié el enlace a la comunidad por mensaje directo ☺️',
  1,
  8,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:running:comment:8:1',
  'inglesconliza',
  'running',
  'Check your DMs! 💕',
  1,
  8,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:running:comment:8:2',
  'inglesconliza',
  'running',
  'Revisa tus comentarios!',
  1,
  8,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:running:comment:8:3',
  'inglesconliza',
  'running',
  'Enviado por mensaje privado!',
  1,
  8,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:club:comment:9:0',
  'inglesconliza',
  'club',
  'Te envié el enlace por mensaje directo ☺️',
  1,
  9,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:club:comment:9:1',
  'inglesconliza',
  'club',
  'Check your DMs! 💕',
  1,
  9,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:club:comment:9:2',
  'inglesconliza',
  'club',
  'Enviado por mensaje privado!',
  1,
  9,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:club:comment:9:3',
  'inglesconliza',
  'club',
  'Revisa tus comentarios!',
  1,
  9,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:default:comment:10:0',
  'inglesconliza',
  'default',
  'Te envié la respuesta por mensaje directo ☺️',
  1,
  10,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:default:comment:10:1',
  'inglesconliza',
  'default',
  'Check your DMs! 💕',
  1,
  10,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:default:comment:10:2',
  'inglesconliza',
  'default',
  'Revisa tus comentarios!',
  1,
  10,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:default:comment:10:3',
  'inglesconliza',
  'default',
  'Enviado por mensaje privado!',
  1,
  10,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:restaurante:comment:11:0',
  'inglesconliza',
  'restaurante',
  '¡Enlace del ebook enviado por mensaje privado! 🚀',
  1,
  11,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:restaurante:comment:11:1',
  'inglesconliza',
  'restaurante',
  '¡Te lo envié por privado!',
  1,
  11,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:restaurante:comment:11:2',
  'inglesconliza',
  'restaurante',
  'Revisa tus DMs! 🚀',
  1,
  11,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:ebook:comment:12:0',
  'inglesconliza',
  'ebook',
  '¡Tu guía va en camino! :wink:',
  1,
  12,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:ebook:comment:12:1',
  'inglesconliza',
  'ebook',
  'Revisa tus DMs! :sparkles:',
  1,
  12,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:ebook:comment:12:2',
  'inglesconliza',
  'ebook',
  '¡Te lo envió por privado! :relaxed:',
  1,
  12,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:50:comment:13:0',
  'inglesconliza',
  '50',
  'Revisa tus DMs:sparkles:',
  1,
  13,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:50:comment:13:1',
  'inglesconliza',
  '50',
  '¡Te lo envío por privado!:smiling_face_with_3_hearts:',
  1,
  13,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:50:comment:13:2',
  'inglesconliza',
  '50',
  '¡Tus frases van en camino!:wink:',
  1,
  13,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:100:comment:14:0',
  'inglesconliza',
  '100',
  'Te lo envío al DM:sparkles:',
  1,
  14,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:100:comment:14:1',
  'inglesconliza',
  '100',
  'Revisa tus DMs:hugging_face:',
  1,
  14,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:100:comment:14:2',
  'inglesconliza',
  '100',
  '¡En camino!:gift:',
  1,
  14,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:cumple:comment:15:0',
  'inglesconliza',
  'cumple',
  'Te lo envío al DM:sparkles:',
  1,
  15,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:cumple:comment:15:1',
  'inglesconliza',
  'cumple',
  'Revisa tus DMs:hugging_face:',
  1,
  15,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:cumple:comment:15:2',
  'inglesconliza',
  'cumple',
  '¡En camino! :gift:',
  1,
  15,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:yess:comment:16:0',
  'inglesconliza',
  'yess',
  '¡Tu guía va en camino! :wink:',
  1,
  16,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:yess:comment:16:1',
  'inglesconliza',
  'yess',
  'Revisa tus DMs! :sparkles:',
  1,
  16,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:yess:comment:16:2',
  'inglesconliza',
  'yess',
  '¡Te lo envió por privado! :relaxed:',
  1,
  16,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:guide:comment:17:0',
  'inglesconliza',
  'guide',
  '¡Tu guía va en camino! :wink:',
  1,
  17,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:guide:comment:17:1',
  'inglesconliza',
  'guide',
  'Revisa tus DMs! :sparkles:',
  1,
  17,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:guide:comment:17:2',
  'inglesconliza',
  'guide',
  '¡Te lo envió por privado! :relaxed:',
  1,
  17,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:avanzar:comment:18:0',
  'inglesconliza',
  'avanzar',
  '¡Tu guía va en camino!',
  1,
  18,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:avanzar:comment:18:1',
  'inglesconliza',
  'avanzar',
  'Revisa tus DMs!',
  1,
  18,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:avanzar:comment:18:2',
  'inglesconliza',
  'avanzar',
  '¡Te lo envió por privado!',
  1,
  18,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:rutina:comment:19:0',
  'inglesconliza',
  'rutina',
  '¡Tu guía va en camino! :wink:',
  1,
  19,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:rutina:comment:19:1',
  'inglesconliza',
  'rutina',
  'Revisa tus DMs! :sparkles:',
  1,
  19,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:rutina:comment:19:2',
  'inglesconliza',
  'rutina',
  '¡Te lo envió por privado! :relaxed:',
  1,
  19,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:tesst:comment:20:0',
  'inglesconliza',
  'tesst',
  '¡Gracias por comentar! Revisa tus DMs 💌',
  1,
  20,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:secreto:comment:21:0',
  'inglesconliza',
  'secreto',
  '¡Tu envié algo! :wink:',
  1,
  21,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:secreto:comment:21:1',
  'inglesconliza',
  'secreto',
  'Revisa tus DMs! :sparkles:',
  1,
  21,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:secreto:comment:21:2',
  'inglesconliza',
  'secreto',
  '¡Te lo envió por privado! :relaxed:',
  1,
  21,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:quiero:comment:22:0',
  'inglesconliza',
  'quiero',
  '¡Tu envié algo! :wink:',
  1,
  22,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:quiero:comment:22:1',
  'inglesconliza',
  'quiero',
  'Revisa tus DMs! :sparkles:',
  1,
  22,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:quiero:comment:22:2',
  'inglesconliza',
  'quiero',
  '¡Te lo envió por privado! :relaxed:',
  1,
  22,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:speaking:comment:23:0',
  'inglesconliza',
  'speaking',
  '¡Tu envié algo! :wink:',
  1,
  23,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:speaking:comment:23:1',
  'inglesconliza',
  'speaking',
  'Revisa tus DMs! :sparkles:',
  1,
  23,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:speaking:comment:23:2',
  'inglesconliza',
  'speaking',
  '¡Te lo envió por privado! :relaxed:',
  1,
  23,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:guia:comment:24:0',
  'inglesconliza',
  'guia',
  '¡Tu envié algo! :wink:',
  1,
  24,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:guia:comment:24:1',
  'inglesconliza',
  'guia',
  'Revisa tus DMs! :sparkles:',
  1,
  24,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:guia:comment:24:2',
  'inglesconliza',
  'guia',
  '¡Te lo envió por privado! :relaxed:',
  1,
  24,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:nativo:comment:25:0',
  'inglesconliza',
  'nativo',
  '¡Tu envié algo! :wink:',
  1,
  25,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:nativo:comment:25:1',
  'inglesconliza',
  'nativo',
  'Revisa tus DMs! :sparkles:',
  1,
  25,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:nativo:comment:25:2',
  'inglesconliza',
  'nativo',
  '¡Te lo envió por privado! :relaxed:',
  1,
  25,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:canal:comment:26:0',
  'inglesconliza',
  'canal',
  '¡Tu envié algo! :wink:',
  1,
  26,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:canal:comment:26:1',
  'inglesconliza',
  'canal',
  'Revisa tus DMs! :sparkles:',
  1,
  26,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:canal:comment:26:2',
  'inglesconliza',
  'canal',
  '¡Te lo envió por privado! :relaxed:',
  1,
  26,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:go:comment:27:0',
  'inglesconliza',
  'go',
  '¡Tu envié algo! :wink:',
  1,
  27,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:go:comment:27:1',
  'inglesconliza',
  'go',
  'Revisa tus DMs! :sparkles:',
  1,
  27,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:go:comment:27:2',
  'inglesconliza',
  'go',
  '¡Te lo envió por privado! :relaxed:',
  1,
  27,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:gratis:comment:28:0',
  'inglesconliza',
  'gratis',
  '¡Tu envié algo! :wink:',
  1,
  28,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:gratis:comment:28:1',
  'inglesconliza',
  'gratis',
  'Revisa tus DMs! :sparkles:',
  1,
  28,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:gratis:comment:28:2',
  'inglesconliza',
  'gratis',
  '¡Te lo envió por privado! :relaxed:',
  1,
  28,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:start:comment:29:0',
  'inglesconliza',
  'start',
  'Revisa tus DMs:sparkles:',
  1,
  29,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:start:comment:29:1',
  'inglesconliza',
  'start',
  '¡Te lo envío por privado!:smiling_face_with_3_hearts:',
  1,
  29,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:start:comment:29:2',
  'inglesconliza',
  'start',
  '¡Algo va en camino!:wink:',
  1,
  29,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:webinar:comment:30:0',
  'inglesconliza',
  'webinar',
  '¡Tu envié algo! :wink:',
  1,
  30,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:webinar:comment:30:1',
  'inglesconliza',
  'webinar',
  'Revisa tus DMs! :sparkles:',
  1,
  30,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:webinar:comment:30:2',
  'inglesconliza',
  'webinar',
  '¡Te lo envió por privado! :relaxed:',
  1,
  30,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:flash:comment:31:0',
  'inglesconliza',
  'flash',
  'Revisa tus DMs:sparkles:',
  1,
  31,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:flash:comment:31:1',
  'inglesconliza',
  'flash',
  '¡Te lo envío por privado!:smiling_face_with_3_hearts:',
  1,
  31,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:flash:comment:31:2',
  'inglesconliza',
  'flash',
  '¡Algo va en camino!:wink:',
  1,
  31,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:vocabulario:comment:32:0',
  'inglesconliza',
  'vocabulario',
  '¡Gracias por comentar! Revisa tus DMs 💌',
  1,
  32,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:vocabulario:comment:32:1',
  'inglesconliza',
  'vocabulario',
  '¡Gracias por comentar! Revisa tus DMs 💌',
  1,
  32,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:hoy:comment:33:0',
  'inglesconliza',
  'hoy',
  '¡Tu envié algo! :wink:',
  1,
  33,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:hoy:comment:33:1',
  'inglesconliza',
  'hoy',
  'Revisa tus DMs! :sparkles:',
  1,
  33,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:hoy:comment:33:2',
  'inglesconliza',
  'hoy',
  '¡Te lo envió por privado! :relaxed:',
  1,
  33,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:clases:comment:34:0',
  'inglesconliza',
  'clases',
  '¡Tu envié algo! :wink:',
  1,
  34,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:clases:comment:34:1',
  'inglesconliza',
  'clases',
  'Revisa tus DMs! :sparkles:',
  1,
  34,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:clases:comment:34:2',
  'inglesconliza',
  'clases',
  '¡Te lo envió por privado! :relaxed:',
  1,
  34,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:comunidad:comment:35:0',
  'inglesconliza',
  'comunidad',
  'Te envié la respuesta por mensaje directo ☺️',
  1,
  35,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:comunidad:comment:35:1',
  'inglesconliza',
  'comunidad',
  'Check your DMs! 💕',
  1,
  35,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:comunidad:comment:35:2',
  'inglesconliza',
  'comunidad',
  'Revisa tus comentarios!',
  1,
  35,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:comunidad:comment:35:3',
  'inglesconliza',
  'comunidad',
  'Enviado por mensaje privado!',
  1,
  35,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:yes:comment:36:0',
  'inglesconliza',
  'yes',
  'Te envié la respuesta por mensaje directo ☺️',
  1,
  36,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:yes:comment:36:1',
  'inglesconliza',
  'yes',
  'Check your DMs! 💕',
  1,
  36,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:yes:comment:36:2',
  'inglesconliza',
  'yes',
  'Revisa tus comentarios!',
  1,
  36,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:yes:comment:36:3',
  'inglesconliza',
  'yes',
  'Enviado por mensaje privado!',
  1,
  36,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:lunes:comment:37:0',
  'inglesconliza',
  'lunes',
  'Te envié la respuesta por mensaje directo ☺️',
  1,
  37,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:lunes:comment:37:1',
  'inglesconliza',
  'lunes',
  'Check your DMs! 💕',
  1,
  37,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:lunes:comment:37:2',
  'inglesconliza',
  'lunes',
  'Revisa tus comentarios!',
  1,
  37,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:lunes:comment:37:3',
  'inglesconliza',
  'lunes',
  'Enviado por mensaje privado!',
  1,
  37,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:black:comment:38:0',
  'inglesconliza',
  'black',
  'Te envié la respuesta por mensaje directo ☺️',
  1,
  38,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:black:comment:38:1',
  'inglesconliza',
  'black',
  'Check your DMs! 💕',
  1,
  38,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:black:comment:38:2',
  'inglesconliza',
  'black',
  'Revisa tus comentarios!',
  1,
  38,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:black:comment:38:3',
  'inglesconliza',
  'black',
  'Enviado por mensaje privado!',
  1,
  38,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:test:comment:39:0',
  'inglesconliza',
  'test',
  'Te envié la respuesta por mensaje directo ☺️',
  1,
  39,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:test:comment:39:1',
  'inglesconliza',
  'test',
  'Check your DMs! 💕',
  1,
  39,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:test:comment:39:2',
  'inglesconliza',
  'test',
  'Revisa tus comentarios!',
  1,
  39,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:test:comment:39:3',
  'inglesconliza',
  'test',
  'Enviado por mensaje privado!',
  1,
  39,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:start:comment:40:0',
  'inglesconliza',
  'start',
  'Te envié la respuesta por mensaje directo ☺️',
  1,
  40,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:start:comment:40:1',
  'inglesconliza',
  'start',
  'Check your DMs! 💕',
  1,
  40,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:start:comment:40:2',
  'inglesconliza',
  'start',
  'Revisa tus comentarios!',
  1,
  40,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:start:comment:40:3',
  'inglesconliza',
  'start',
  'Enviado por mensaje privado!',
  1,
  40,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:dishes:comment:41:0',
  'inglesconliza',
  'dishes',
  'Te envié la respuesta por mensaje directo ☺️',
  1,
  41,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:dishes:comment:41:1',
  'inglesconliza',
  'dishes',
  'Check your DMs! 💕',
  1,
  41,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:dishes:comment:41:2',
  'inglesconliza',
  'dishes',
  'Revisa tus comentarios!',
  1,
  41,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:dishes:comment:41:3',
  'inglesconliza',
  'dishes',
  'Enviado por mensaje privado!',
  1,
  41,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:clases:comment:42:0',
  'inglesconliza',
  'clases',
  'Te envié la respuesta por mensaje directo ☺️',
  1,
  42,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:clases:comment:42:1',
  'inglesconliza',
  'clases',
  'Check your DMs! 💕',
  1,
  42,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:clases:comment:42:2',
  'inglesconliza',
  'clases',
  'Revisa tus comentarios!',
  1,
  42,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:clases:comment:42:3',
  'inglesconliza',
  'clases',
  'Enviado por mensaje privado!',
  1,
  42,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:money:comment:43:0',
  'inglesconliza',
  'money',
  'Te envié la respuesta por mensaje directo ☺️',
  1,
  43,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:money:comment:43:1',
  'inglesconliza',
  'money',
  'Check your DMs! 💕',
  1,
  43,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:money:comment:43:2',
  'inglesconliza',
  'money',
  'Revisa tus comentarios!',
  1,
  43,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:money:comment:43:3',
  'inglesconliza',
  'money',
  'Enviado por mensaje privado!',
  1,
  43,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:25:comment:44:0',
  'inglesconliza',
  '25',
  'Te envié la respuesta por mensaje directo ☺️',
  1,
  44,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:25:comment:44:1',
  'inglesconliza',
  '25',
  'Check your DMs! 💕',
  1,
  44,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:25:comment:44:2',
  'inglesconliza',
  '25',
  'Revisa tus comentarios!',
  1,
  44,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:25:comment:44:3',
  'inglesconliza',
  '25',
  'Enviado por mensaje privado!',
  1,
  44,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:casco:comment:45:0',
  'inglesconliza',
  'casco',
  'Revisa tus mensajes directos para más detalles.',
  1,
  45,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:casco:comment:45:1',
  'inglesconliza',
  'casco',
  'Te envié la respuesta por mensaje directo ☺️',
  1,
  45,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:casco:comment:45:2',
  'inglesconliza',
  'casco',
  'Check your DMs! 💕',
  1,
  45,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:casco:comment:45:3',
  'inglesconliza',
  'casco',
  'Revisa tus comentarios!',
  1,
  45,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:casco:comment:45:4',
  'inglesconliza',
  'casco',
  'Enviado por mensaje privado!',
  1,
  45,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:cuando:comment:46:0',
  'inglesconliza',
  'cuando',
  'Revisa tus mensajes directos para más detalles.',
  1,
  46,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:lista:comment:47:0',
  'inglesconliza',
  'lista',
  'Revisa tus mensajes directos para más detalles.',
  1,
  47,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:lista:comment:47:1',
  'inglesconliza',
  'lista',
  'Te envié la respuesta por mensaje directo ☺️',
  1,
  47,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:lista:comment:47:2',
  'inglesconliza',
  'lista',
  'Check your DMs! 💕',
  1,
  47,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:lista:comment:47:3',
  'inglesconliza',
  'lista',
  'Revisa tus comentarios!',
  1,
  47,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:lista:comment:47:4',
  'inglesconliza',
  'lista',
  'Enviado por mensaje privado!',
  1,
  47,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:lentes:comment:48:0',
  'inglesconliza',
  'lentes',
  'Revisa tus mensajes directos para más detalles.',
  1,
  48,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:lentes:comment:48:1',
  'inglesconliza',
  'lentes',
  'Te envié la respuesta por mensaje directo ☺️',
  1,
  48,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:lentes:comment:48:2',
  'inglesconliza',
  'lentes',
  'Check your DMs! 💕',
  1,
  48,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:workout:comment:49:0',
  'inglesconliza',
  'workout',
  'Revisa tus mensajes directos para más detalles.',
  1,
  49,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:workout:comment:49:1',
  'inglesconliza',
  'workout',
  'Te envié la respuesta por mensaje directo ☺️',
  1,
  49,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:workout:comment:49:2',
  'inglesconliza',
  'workout',
  'Check your DMs! 💕',
  1,
  49,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:por:comment:50:0',
  'inglesconliza',
  'por',
  'Revisa tus mensajes directos para más detalles.',
  1,
  50,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:por:comment:50:1',
  'inglesconliza',
  'por',
  'Te envié la respuesta por mensaje directo ☺️',
  1,
  50,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:por:comment:50:2',
  'inglesconliza',
  'por',
  'Check your DMs! 💕',
  1,
  50,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:mio:comment:51:0',
  'inglesconliza',
  'mio',
  'Revisa tus mensajes directos para más detalles.',
  1,
  51,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:mio:comment:51:1',
  'inglesconliza',
  'mio',
  'Te envié la respuesta por mensaje directo ☺️',
  1,
  51,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:mio:comment:51:2',
  'inglesconliza',
  'mio',
  'Check your DMs! 💕',
  1,
  51,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:entrevista:comment:52:0',
  'inglesconliza',
  'entrevista',
  'Te envié la respuesta por mensaje directo ☺️',
  1,
  52,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:entrevista:comment:52:1',
  'inglesconliza',
  'entrevista',
  'Check your DMs! 💕',
  1,
  52,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:entrevista:comment:52:2',
  'inglesconliza',
  'entrevista',
  'Revisa tus comentarios!',
  1,
  52,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:entrevista:comment:52:3',
  'inglesconliza',
  'entrevista',
  'Enviado por mensaje privado!',
  1,
  52,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:profesionales:comment:53:0',
  'inglesconliza',
  'profesionales',
  'Te envié la respuesta por mensaje directo ☺️',
  1,
  53,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:profesionales:comment:53:1',
  'inglesconliza',
  'profesionales',
  'Check your DMs! 💕',
  1,
  53,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:profesionales:comment:53:2',
  'inglesconliza',
  'profesionales',
  'Revisa tus comentarios!',
  1,
  53,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:profesionales:comment:53:3',
  'inglesconliza',
  'profesionales',
  'Enviado por mensaje privado!',
  1,
  53,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:tanto:comment:54:0',
  'inglesconliza',
  'tanto',
  'Revisa tus mensajes directos para más detalles.',
  1,
  54,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:tanto:comment:54:1',
  'inglesconliza',
  'tanto',
  'Te envié la respuesta por mensaje directo ☺️',
  1,
  54,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:tanto:comment:54:2',
  'inglesconliza',
  'tanto',
  'Check your DMs! 💕',
  1,
  54,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:terminar:comment:55:0',
  'inglesconliza',
  'terminar',
  'Revisa tus mensajes directos para más detalles.',
  1,
  55,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:terminar:comment:55:1',
  'inglesconliza',
  'terminar',
  'Te envié la respuesta por mensaje directo ☺️',
  1,
  55,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:terminar:comment:55:2',
  'inglesconliza',
  'terminar',
  'Check your DMs! 💕',
  1,
  55,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:creo:comment:56:0',
  'inglesconliza',
  'creo',
  'Te envié la respuesta por mensaje directo ☺️',
  1,
  56,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:creo:comment:56:1',
  'inglesconliza',
  'creo',
  'Check your DMs! 💕',
  1,
  56,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:creo:comment:56:2',
  'inglesconliza',
  'creo',
  'Revisa tus comentarios!',
  1,
  56,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:creo:comment:56:3',
  'inglesconliza',
  'creo',
  'Enviado por mensaje privado!',
  1,
  56,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:10:comment:57:0',
  'inglesconliza',
  '10',
  'Te lo envío al DM:sparkles:',
  1,
  57,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:10:comment:57:1',
  'inglesconliza',
  '10',
  'Revisa tus DMs:hugging_face:',
  1,
  57,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:10:comment:57:2',
  'inglesconliza',
  '10',
  '¡En camino!:gift:',
  1,
  57,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:siempre:comment:58:0',
  'inglesconliza',
  'siempre',
  'Te envié la respuesta por mensaje directo ☺️',
  1,
  58,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:siempre:comment:58:1',
  'inglesconliza',
  'siempre',
  'Check your DMs! 💕',
  1,
  58,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:siempre:comment:58:2',
  'inglesconliza',
  'siempre',
  'Revisa tus comentarios!',
  1,
  58,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:siempre:comment:58:3',
  'inglesconliza',
  'siempre',
  'Enviado por mensaje privado!',
  1,
  58,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:tea:comment:59:0',
  'inglesconliza',
  'tea',
  'Te envié la respuesta por mensaje directo ☺️',
  1,
  59,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:tea:comment:59:1',
  'inglesconliza',
  'tea',
  'Check your DMs! 💕',
  1,
  59,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:tea:comment:59:2',
  'inglesconliza',
  'tea',
  'Revisa tus comentarios!',
  1,
  59,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:tea:comment:59:3',
  'inglesconliza',
  'tea',
  'Enviado por mensaje privado!',
  1,
  59,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:earphones:comment:60:0',
  'inglesconliza',
  'earphones',
  'Te envié la respuesta por mensaje directo ☺️',
  1,
  60,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:earphones:comment:60:1',
  'inglesconliza',
  'earphones',
  'Check your DMs! 💕',
  1,
  60,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:earphones:comment:60:2',
  'inglesconliza',
  'earphones',
  'Revisa tus comentarios!',
  1,
  60,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:earphones:comment:60:3',
  'inglesconliza',
  'earphones',
  'Enviado por mensaje privado!',
  1,
  60,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:water:comment:61:0',
  'inglesconliza',
  'water',
  'Te envié la respuesta por mensaje directo ☺️',
  1,
  61,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:water:comment:61:1',
  'inglesconliza',
  'water',
  'Check your DMs! 💕',
  1,
  61,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:water:comment:61:2',
  'inglesconliza',
  'water',
  'Revisa tus comentarios!',
  1,
  61,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:water:comment:61:3',
  'inglesconliza',
  'water',
  'Enviado por mensaje privado!',
  1,
  61,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:time:comment:62:0',
  'inglesconliza',
  'time',
  'Te envié la respuesta por mensaje directo ☺️',
  1,
  62,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:time:comment:62:1',
  'inglesconliza',
  'time',
  'Check your DMs! 💕',
  1,
  62,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:time:comment:62:2',
  'inglesconliza',
  'time',
  'Revisa tus comentarios!',
  1,
  62,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:time:comment:62:3',
  'inglesconliza',
  'time',
  'Enviado por mensaje privado!',
  1,
  62,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:song:comment:63:0',
  'inglesconliza',
  'song',
  'Te envié la respuesta por mensaje directo ☺️',
  1,
  63,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:song:comment:63:1',
  'inglesconliza',
  'song',
  'Check your DMs! 💕',
  1,
  63,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:song:comment:63:2',
  'inglesconliza',
  'song',
  'Revisa tus comentarios!',
  1,
  63,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:song:comment:63:3',
  'inglesconliza',
  'song',
  'Enviado por mensaje privado!',
  1,
  63,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:musica:comment:64:0',
  'inglesconliza',
  'musica',
  'Te envié la respuesta por mensaje directo ☺️',
  1,
  64,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:musica:comment:64:1',
  'inglesconliza',
  'musica',
  'Check your DMs! 💕',
  1,
  64,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:musica:comment:64:2',
  'inglesconliza',
  'musica',
  'Revisa tus comentarios!',
  1,
  64,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:musica:comment:64:3',
  'inglesconliza',
  'musica',
  'Enviado por mensaje privado!',
  1,
  64,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:c1:comment:65:0',
  'inglesconliza',
  'c1',
  'Te envié la respuesta por mensaje directo ☺️',
  1,
  65,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:c1:comment:65:1',
  'inglesconliza',
  'c1',
  'Check your DMs! 💕',
  1,
  65,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:c1:comment:65:2',
  'inglesconliza',
  'c1',
  'Revisa tus comentarios!',
  1,
  65,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:c1:comment:65:3',
  'inglesconliza',
  'c1',
  'Enviado por mensaje privado!',
  1,
  65,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:escalera:comment:66:0',
  'inglesconliza',
  'escalera',
  'Te envié la respuesta por mensaje directo ☺️',
  1,
  66,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:escalera:comment:66:1',
  'inglesconliza',
  'escalera',
  'Check your DMs! 💕',
  1,
  66,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:escalera:comment:66:2',
  'inglesconliza',
  'escalera',
  'Revisa tus comentarios!',
  1,
  66,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:escalera:comment:66:3',
  'inglesconliza',
  'escalera',
  'Enviado por mensaje privado!',
  1,
  66,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
);

INSERT INTO instagram_response_profile_dms (
  id, profile, hashtag, value, active, priority, updated_at, source
)
VALUES
(
  'inglesconliza:vip:dm:1:0',
  'inglesconliza',
  'vip',
  '💬 Únete al  n  VIP (cupos limitados): https://chat.whatsapp.com/KXLl2yZSOwZGbsOkgFW0Iq
Enviaré regalos, tips diarios, ejercicios  y ofertas especiales! Exclusivo en el grupo, te espero',
  1,
  1,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:brunch:dm:2:0',
  'inglesconliza',
  'brunch',
  'Para saber mas sobre el Brunch, entra al grupo de WhatsApp: https://inglesconliza.com/comunidad
¡Nos vemos ahí! 🚀',
  1,
  2,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:tips:dm:3:0',
  'inglesconliza',
  'tips',
  '¡Hola! 🤗 Te envío la guía en PDF de las "10 Tips para hablar en Inglés":
Aquí tienes el enlace: https://www.inglesconliza.com/pdf10tips solo tienes que poner tu correo electrónico y podrás descargarla.
💬 Únete al grupo VIP (cupos limitados): https://chat.whatsapp.com/GsZGSSrtWuQDhbhAVI5zXg',
  1,
  3,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:ebook:dm:4:0',
  'inglesconliza',
  'ebook',
  '¡Hola! 🤗 Te envío el ebook en PDF de las "10 Tips para hablar en Inglés":
Aquí tienes el enlace: https://www.inglesconliza.com/pdf10tips solo tienes que poner tu correo electrónico y podrás descargarla.
¿Necesitas avanzar y no sabes por donde comenzar? Escríbeme y te ayudo:
https://wa.me/message/KVOXTS3RQ7KYC1
¡Un abrazo! 💕',
  1,
  4,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:grupo:dm:5:0',
  'inglesconliza',
  'grupo',
  'Únete gratis a mi comunidad en WhatsApp 📲
https://chat.whatsapp.com/JjXPtJlvOnF6p5eJ5z547Q',
  1,
  5,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:mentoría:dm:6:0',
  'inglesconliza',
  'mentoría',
  '¡Qué emoción que te interese la mentoría! 💬
 Completa este formulario y te escribo para agendar una llamada:
 👉 https://forms.gle/BL6BiLzD63uDXCga9',
  1,
  6,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:mentoria:dm:7:0',
  'inglesconliza',
  'mentoria',
  '¡Qué emoción que te interese la mentoría! 💬
 Completa este formulario y te escribo para agendar una llamada:
 👉 https://forms.gle/BL6BiLzD63uDXCga9',
  1,
  7,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:running:dm:8:0',
  'inglesconliza',
  'running',
  '¿Quieres recibir tips de inglés todos los días, practicar frases reales y mantenerte motivado/a? Únete gratis a mi comunidad en WhatsApp 📲 Es contenido útil, rápido y directo a tu celular.
✨ Progress, not perfection.
Comunidad: https://inglesconliza.com/comunidad',
  1,
  8,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:club:dm:9:0',
  'inglesconliza',
  'club',
  'Puedes  comenzar tu transformacion hoy, inscríbete aquí 👉
https://curso.inglesconliza.com/club-de-ingles-promo/
 ¡No lo dejes pasar solo por 24! ✅',
  1,
  9,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:default:dm:10:0',
  'inglesconliza',
  'default',
  'Comunidad: https://inglesconliza.com/comunidad
¿Necesitas mejorar tu speaking?
Te tengo la solución, escríbeme por WhatsApp.
  Escribir a Liza 👉 https://wa.me/message/KVOXTS3RQ7KYC1
Avancemos juntos 👉
¡ A mejorar tu inglés!',
  1,
  10,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:restaurante:dm:11:0',
  'inglesconliza',
  'restaurante',
  '¡Hola! 🤗
 Te envío mi audio guía gratuita:
https://pronuncia.inglesconliza.com/20-restaurant
Club de inglés — crea tu hábito diario conmigo.
👉 https://curso.inglesconliza.com/club-de-ingles-con-liza/
¡Un abrazo! 💕',
  1,
  11,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:ebook:dm:12:0',
  'inglesconliza',
  'ebook',
  '😊 Aquí va tu guía que lo disfrutes.
https://www.inglesconliza.com/guia
Comienza a perder el miedo hoy mismo 👉  https://curso.inglesconliza.com/club-de-ingles-con-liza/',
  1,
  12,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:50:dm:13:0',
  'inglesconliza',
  '50',
  '¡Hola! Aquí van tus 50 Frases :blush:
https:www.inglesconliza.com/pdf100frases
:gift: Promo flash! por tiempo limitado por 2 horas: https://curso.inglesconliza.com/club-de-ingles-con-liza/?utm_source=metameta&utm_campaign=lettrythis
¡Abrazo!:sparkles::hugging_face:',
  1,
  13,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:100:dm:14:0',
  'inglesconliza',
  '100',
  '¡Aquí va tu regalo con 100 frases!
https://inglesconliza.com/pdf100frases
💬 Únete al grupo VIP (cupos limitados): https://chat.whatsapp.com/GsZGSSrtWuQDhbhAVI5zXg
¡Un abrazo!',
  1,
  14,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:cumple:dm:15:0',
  'inglesconliza',
  'cumple',
  'Hola, estoy feliz de cumplir años y celebrar 1 año desde el lanzamiento de nuestro club de inglés con Liza y ¡quiero celebrarlo contigo! Te espero en el club.
:gift::sparkles: Promo flash: Por tiempo limitado por 2 horas:
https://curso.inglesconliza.com/club-de-ingles-con-liza/',
  1,
  15,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:yess:dm:16:0',
  'inglesconliza',
  'yess',
  '¡YES! :hugging_face: Aquí va tu guía que lo disfrutes.
https://www.inglesconliza.com/guia
:gift:¡Promo flash! por tiempo limitado por 2 horas: https://curso.inglesconliza.com/club-de-ingles-con-liza/?utm_source=metameta&utm_campaign=lettrythis
¡Abrazos! :sparkles::two_hearts:',
  1,
  16,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:guide:dm:17:0',
  'inglesconliza',
  'guide',
  'Hola, ¿cómo estás?  Aquí va tu guía que lo disfrutes.
https://pronuncia.inglesconliza.com
¡Promo flash solo por HOY!  Haz clic aquí 👉 https://curso.inglesconliza.com/club-de-ingles-con-liza/?utm_source=metameta&utm_campaign=lettrythis
¡Abrazos!',
  1,
  17,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:avanzar:dm:18:0',
  'inglesconliza',
  'avanzar',
  '¿Sientes que necesitas mejorar tu inglés pero no sabes por dónde empezar? 💬
 Comienza a crear tu hábito hoy, oferta flash por 2 horas  👉 https://curso.inglesconliza.com/club-de-ingles-promo/
Te espero 🙌🎉',
  1,
  18,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:rutina:dm:19:0',
  'inglesconliza',
  'rutina',
  'Prompt listo para usar en ChaGPT:
Actúa como un profesor de inglés especializado en estudiantes de nivel A2. Ayúdame a crear una rutina de estudio semanal para mejorar mi inglés en las 5 habilidades: listening, speaking, reading, writing y grammar. Quiero estudiar 5 días a la semana durante 30 a 60 minutos al día. Divide la rutina por días, sugiere actividades concretas, recursos gratuitos online (como videos, canciones, ejercicios interactivos), y finaliza cada día con una pequeña evaluación o repaso.
💬 Únete al grupo VIP de Black Friday (cupos limitados): https://chat.whatsapp.com/KXLl2yZSOwZGbsOkgFW0Iq
Enviaré regalos, tips diarios, ejercicios a partir del 17 de noviembre! Exclusivo en el grupo, te espero',
  1,
  19,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:tesst:dm:20:0',
  'inglesconliza',
  'tesst',
  '¡Hola! 👋
La respuesta correcta es:
✅ settled down que significa asentarse.
🙌 Es un phrasal verb muy usado.
¿Quieres seguir avanzando con una estructura clara todos los días? 🗓️
Únete a mi club de inglés y comenzamos: https://curso.inglesconliza.com/club-de-ingles-con-liza/
¡Un abrazo! 💕',
  1,
  20,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:secreto:dm:21:0',
  'inglesconliza',
  'secreto',
  '¿Sientes que necesitas mejorar tu inglés pero no sabes por dónde empezar? 💬
 📌 Club de Inglés con contenido diario, fácil y práctico
Oferta flash solo por este mensaje.
$19 en vez de $114 👉  https://curso.inglesconliza.com/club-de-ingles-promo/',
  1,
  21,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:quiero:dm:22:0',
  'inglesconliza',
  'quiero',
  '💬 Únete al grupo VIP https://chat.whatsapp.com/KXLl2yZSOwZGbsOkgFW0Iq',
  1,
  22,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:speaking:dm:23:0',
  'inglesconliza',
  'speaking',
  '¿Te gustaría mejorar tu speaking y destacarte en tu trabajo por tu profesionalismo y fluidez? 💬
Escríbeme por WhatsApp y te ayudo a encontrar el mejor camino para avanzar:
👉 https://wa.me/message/KVOXTS3RQ7KYC1',
  1,
  23,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:guia:dm:24:0',
  'inglesconliza',
  'guia',
  'Descarga la guía aquí: https://www.inglesconliza.com/guia
💬 Únete al grupo VIP de Black Friday (cupos limitados): https://chat.whatsapp.com/KXLl2yZSOwZGbsOkgFW0Iq
Enviaré regalos, tips diarios, ejercicios a partir del 20 de noviembre! Exclusivo en el grupo, te espero',
  1,
  24,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:nativo:dm:25:0',
  'inglesconliza',
  'nativo',
  'Si necesitas mejorar tu inglés y no quieres perder más tiempo, te espero en mi grupo gratuito de WhatsApp.
Allí publico tips diarios y cuento sobre las herramientas que tengo para que puedas avanzar rápido 💨
💬 Únete acá, cupos limitados 👉 https://chat.whatsapp.com/KXLl2yZSOwZGbsOkgFW0Iq',
  1,
  25,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:canal:dm:26:0',
  'inglesconliza',
  'canal',
  '¡Gracias por comentar!
🎯 Aquí te dejo el link para unirte a mi Canal exclusivo de Telegram, donde comparto tips, frases útiles y contenido para hablar inglés con más seguridad:
 👉 https://t.me/inglesconliza',
  1,
  26,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:go:dm:27:0',
  'inglesconliza',
  'go',
  '🙌 ¡Gracias por estar en el live!
🚨 Solo HOY oferta especial:
💬 Escríbeme YA 👇
https://wa.me/message/KVOXTS3RQ7KYC1',
  1,
  27,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:gratis:dm:28:0',
  'inglesconliza',
  'gratis',
  'Únete a mi canal de Telegram: https://t.me/inglesconliza
  ¿Sientes que necesitas mejorar tu inglés pero no sabes por dónde empezar? 💬
Escríbeme por WhatsApp y te ayudo a encontrar el mejor camino para avanzar:
 Escribir a Liza 👉 https://wa.me/message/KVOXTS3RQ7KYC1',
  1,
  28,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:start:dm:29:0',
  'inglesconliza',
  'start',
  '¡La PROMO FLASH está activa solo hasta mañana:
✅ Precio exclusivo: $19.38/ al mes en vez de $114
✅ Acceso inmediato al Club de Inglés con Liza
👉 Inscríbete aquí: https://curso.inglesconliza.com/club-de-ingles-promo/',
  1,
  29,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:webinar:dm:30:0',
  'inglesconliza',
  'webinar',
  '¿Sientes que necesitas mejorar tu inglés pero no sabes por dónde empezar? 💬
Te espero en mi webinar gratuito Destraba tu inglés 💬 este 09 de octubre.
Inscríbete aquí: https://forms.gle/vddsKhDfjkVDpoFW7
 Grupo de WhatsApp 👉 https://chat.whatsapp.com/FsRBfyPWiNNGQheGHeum5c',
  1,
  30,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:flash:dm:31:0',
  'inglesconliza',
  'flash',
  '🔥 PROMO FLASH ACTIVADA:
 ✅ Club + 2 clases Speaking: $99/mes (antes $399)
 ⏰ Solo hasta mañana a medianoche
👉 Escríbeme aquí para inscribirte:
https://wa.me/message/KVOXTS3RQ7KYC1',
  1,
  31,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:vocabulario:dm:32:0',
  'inglesconliza',
  'vocabulario',
  '¡Hola! 👋 Liza acaba de lanzar una súper promo en un Live 🙌
Te paso los detalles de la promo especial de hoy 🎁:
✅ 3 eBooks de vocabulario práctico: Aeropuerto, Restaurante y Médico
✅ Audioguías con pronunciación profesional
✅ Traducción y ejemplos reales para que los uses desde el primer día
💰 Solo $49 (antes $149)
Puedes hacer el pago directo aquí 👉 https://buy.stripe.com/cNiaEX55q1rTcdU37C2Nq08',
  1,
  32,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:hoy:dm:33:0',
  'inglesconliza',
  'hoy',
  'Únete a mi canal de Telegram: https://t.me/inglesconliza
  ¿Sientes que necesitas mejorar tu inglés pero no sabes por dónde empezar? 💬
Escríbeme por WhatsApp y te ayudo a encontrar el mejor camino para avanzar:
 Escribir a Liza 👉 https://wa.me/message/KVOXTS3RQ7KYC1',
  1,
  33,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:clases:dm:34:0',
  'inglesconliza',
  'clases',
  '💥 Estás viendo el live = tienes 80% OFF
No lo dejes pasar
Haz clic en el link: https://curso.inglesconliza.com/club-de-ingles-promo/',
  1,
  34,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:comunidad:dm:35:0',
  'inglesconliza',
  'comunidad',
  'Te espero en mi comunidad para más tips: https://chat.whatsapp.com/JQaBKDqVijE6A6FzVs8Rn9
Let''s improve your English together!',
  1,
  35,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:yes:dm:36:0',
  'inglesconliza',
  'yes',
  '💬 Únete al grupo VIP de Black Friday (cupos limitados): https://chat.whatsapp.com/FsRBfyPWiNNGQheGHeum5c
Enviaré regalos, tips diarios, ejercicios a partir del 20 de noviembre! Exclusivo en el grupo, te espero',
  1,
  36,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:lunes:dm:37:0',
  'inglesconliza',
  'lunes',
  '💬 Únete al grupo VIP de Black Friday (cupos limitados): https://chat.whatsapp.com/KXLl2yZSOwZGbsOkgFW0Iq
Enviaré regalos, tips diarios, ejercicios a partir del 17 de noviembre! Exclusivo en el grupo, te espero',
  1,
  37,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:black:dm:38:0',
  'inglesconliza',
  'black',
  'Últimas dos horas!! 🔥 Mejora tu inglés con 75% de descuento solo estos días: https://curso.inglesconliza.com/black-friday-3/
💬  Te atiendo personalmente: https://wa.me/message/KVOXTS3RQ7KYC1',
  1,
  38,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:test:dm:39:0',
  'inglesconliza',
  'test',
  'Te dejo el test aqui: https://www.inglesconliza.com/nivelacion
 💬 Únete al grupo VIP (cupos limitados): https://chat.whatsapp.com/KXLl2yZSOwZGbsOkgFW0Iq',
  1,
  39,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:start:dm:40:0',
  'inglesconliza',
  'start',
  '💬 ¿No sabes tu nivel de inglés? Te atiendo personalmente: https://wa.me/message/KVOXTS3RQ7KYC1',
  1,
  40,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:dishes:dm:41:0',
  'inglesconliza',
  'dishes',
  'Se dice: I’m doing the dishes
💬 ¿Necesitas mejorar tu inglés diariamente? Te espero en mi club: https://curso.inglesconliza.com/club-de-ingles-promo/',
  1,
  41,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:clases:dm:42:0',
  'inglesconliza',
  'clases',
  '💥 Estás viendo el live = tienes 80% OFF
No lo dejes pasar 👉
https://curso.inglesconliza.com/club-de-ingles-promo/',
  1,
  42,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:money:dm:43:0',
  'inglesconliza',
  'money',
  'Let''s count our cash!
💥 Estás viendo el live = tienes 80% OFF
No lo dejes pasar 👉
https://curso.inglesconliza.com/club-de-ingles-promo/',
  1,
  43,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:25:dm:44:0',
  'inglesconliza',
  '25',
  'Aquí tienes 25 conectores comunes en inglés, clasificados por su función. Para ayudarte a estructurar tus ideas: And (y), But (pero), However (sin embargo), Moreover/Furthermore (además), Therefore/So (por lo tanto/entonces), Because/Since (porque/puesto que), In addition to (además de), On the other hand (por otro lado), First/Firstly (en primer lugar), Finally/Lastly (finalmente), In conclusion (en conclusión), For example (por ejemplo), Also (también), Although/Even though (aunque), Due to (debido a), In order to (para), As a result (como resultado), Meanwhile (mientras tanto), Nevertheless (no obstante), Instead (en lugar de), Also (también), In fact (de hecho), For instance (por ejemplo), To summarize (para resumir), y Meanwhile (mientras tanto) para dar fluidez a tu discurso.
 80% OFF en mi club de inglés!
No lo dejes pasar 👉
https://curso.inglesconliza.com/club-de-ingles-promo/',
  1,
  44,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:casco:dm:45:0',
  'inglesconliza',
  'casco',
  'Se dice: I''m putting on my helmet
💬 Únete al grupo VIP (cupos limitados): https://chat.whatsapp.com/KXLl2yZSOwZGbsOkgFW0Iq
Enviaré regalos, tips diarios, ejercicios  y ofertas especiales! Exclusivo en el grupo, te espero',
  1,
  45,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:cuando:dm:46:0',
  'inglesconliza',
  'cuando',
  'Se dice: Whenever you feel like it
💬 Únete al grupo VIP (cupos limitados): https://chat.whatsapp.com/JVfmgv9UNGoLAOgCNEAUOM
Envío tips diarios, ejercicios  y ofertas especiales! Exclusivo en el grupo, te espero',
  1,
  46,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:lista:dm:47:0',
  'inglesconliza',
  'lista',
  'Lista completa:
1. Agrio - Sour
2. Dulce - Sweet
3. Salado - Savory
4. Amargo - Bitter
5. Umami - Umami
6. Picante - Spicy
7. Fresco - Fresh
8. Levemente dulce - Mildly Sweet
9. Intenso - Intense
10. Ácido - Acidic
💬 Únete al grupo VIP (cupos limitados): https://chat.whatsapp.com/JVfmgv9UNGoLAOgCNEAUOM
Envío tips diarios, ejercicios  y ofertas especiales! Exclusivo en el grupo, te espero',
  1,
  47,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:lentes:dm:48:0',
  'inglesconliza',
  'lentes',
  'Se dice: I’m putting on my glasses and I’m taking them off.
💬 Únete al grupo VIP (cupos limitados): https://chat.whatsapp.com/JVfmgv9UNGoLAOgCNEAUOM
Envío tips diarios, ejercicios  y ofertas especiales! Exclusivo en el grupo, te espero',
  1,
  48,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:workout:dm:49:0',
  'inglesconliza',
  'workout',
  'Se dice: I enjoy/like working out 🏋️
💬 Únete al grupo VIP (cupos limitados): https://chat.whatsapp.com/JVfmgv9UNGoLAOgCNEAUOM
Envío tips diarios, ejercicios  y ofertas especiales! Exclusivo en el grupo, te espero',
  1,
  49,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:por:dm:50:0',
  'inglesconliza',
  'por',
  'La expresión "por eso" en inglés se traduce como "that''s why." Aquí tienes dos ejemplos:
1. Estoy cansado, por eso no puedo salir.
 I’m tired, that’s why I can’t go out.
2. Ella estudió mucho, por eso aprobó el examen.
 She studied a lot, that’s why she passed the exam.
💬 Únete al grupo VIP (cupos limitados):
https://chat.whatsapp.com/GsZGSSrtWuQDhbhAVI5zXg
Envío tips diarios, ejercicios  y ofertas especiales! Exclusivo en el grupo, te espero',
  1,
  50,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:mio:dm:51:0',
  'inglesconliza',
  'mio',
  'Se puede decir: It slipped my mind!
I totally forgot
💬 Únete al grupo VIP (cupos limitados):
https://chat.whatsapp.com/KvqzW7uYEHd44JMqk9c2Dq?mode=gi_t
Envío tips diarios, ejercicios  y ofertas especiales! Exclusivo en el grupo, te espero',
  1,
  51,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:entrevista:dm:52:0',
  'inglesconliza',
  'entrevista',
  '💬 Te espero en mi grupo para profesionales: https://chat.whatsapp.com/HqMZW1PZXGMC5g4cDPYzzH',
  1,
  52,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:profesionales:dm:53:0',
  'inglesconliza',
  'profesionales',
  '💬 Te espero en mi grupo para profesionales: https://chat.whatsapp.com/HqMZW1PZXGMC5g4cDPYzzH',
  1,
  53,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:tanto:dm:54:0',
  'inglesconliza',
  'tanto',
  'Se puede decir:  I’ll keep you posted
💬 Únete al grupo VIP (cupos limitados):
https://chat.whatsapp.com/KvqzW7uYEHd44JMqk9c2Dq?mode=gi_t
Envío tips diarios, ejercicios  y ofertas especiales! Exclusivo en el grupo, te espero',
  1,
  54,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:terminar:dm:55:0',
  'inglesconliza',
  'terminar',
  'Se puede decir: Let’s call it a day!
💬 Únete al grupo VIP (cupos limitados):
https://chat.whatsapp.com/KvqzW7uYEHd44JMqk9c2Dq?mode=gi_t
Envío tips diarios, ejercicios  y ofertas especiales! Exclusivo en el grupo, te espero',
  1,
  55,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:creo:dm:56:0',
  'inglesconliza',
  'creo',
  '💬 una de las respuestas es: I don’t but it
  Te espero en mi comunidad para más tips: https://chat.whatsapp.com/KXLl2yZSOwZGbsOkgFW0Iq
Let''s improve your English together!',
  1,
  56,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:10:dm:57:0',
  'inglesconliza',
  '10',
  '¡Aquí va tu regalo mi ebook con los 10 tips para mejorar tu inglés!
https://www.inglesconliza.com/pdf10tips
💬 Únete al grupo VIP (cupos limitados): https://chat.whatsapp.com/GsZGSSrtWuQDhbhAVI5zXg
¡Un abrazo!',
  1,
  57,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:siempre:dm:58:0',
  'inglesconliza',
  'siempre',
  '💬 una de las respuestas es: Same old!
  Te espero en mi comunidad para más tips: https://chat.whatsapp.com/KXLl2yZSOwZGbsOkgFW0Iq
Let''s improve your English together!',
  1,
  58,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:tea:dm:59:0',
  'inglesconliza',
  'tea',
  '💬 una de las respuestas es: I''m pouring myself a cup of tea!
 Te espero en mi grupo para más tips, cupos limitados: https://chat.whatsapp.com/FsRBfyPWiNNGQheGHeum5c',
  1,
  59,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:earphones:dm:60:0',
  'inglesconliza',
  'earphones',
  'Se dice: I''m putting on my earphones.
Te espero en mi grupo para más tips, cupos limitados:  https://chat.whatsapp.com/KXLl2yZSOwZGbsOkgFW0Iq',
  1,
  60,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:water:dm:61:0',
  'inglesconliza',
  'water',
  '💬 una de las respuestas es: I ran out of water!
 Te espero en mi grupo para más tips, cupos limitados: https://chat.whatsapp.com/FsRBfyPWiNNGQheGHeum5c',
  1,
  61,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:time:dm:62:0',
  'inglesconliza',
  'time',
  '💬 una de las respuestas es: I’m running out of time!
 Te espero en mi grupo para más tips, cupos limitados: https://chat.whatsapp.com/FsRBfyPWiNNGQheGHeum5c',
  1,
  62,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:song:dm:63:0',
  'inglesconliza',
  'song',
  'Descarga la guía aquí: https://drive.google.com/file/d/1HAp55yt48d7t3zxDTwgNVTcoyKX4SNPQ/view?usp=drive_link
Iscríbete al evento Singlish Sessions en Asunción: 📲https://wa.me/message/KVOXTS3RQ7KYC1',
  1,
  63,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:musica:dm:64:0',
  'inglesconliza',
  'musica',
  'Únete al grupo: https://chat.whatsapp.com/JIX2WX5IUfBF5a1NjFlJ5T?mode=gi_t
Iscríbete al evento Singlish Sessions en Asunción: 📲https://wa.me/message/KVOXTS3RQ7KYC1',
  1,
  64,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:c1:dm:65:0',
  'inglesconliza',
  'c1',
  'Se puede decir: Like father, like son.
Únete  a mi grupo de WhatsApp, cupos limitados:
https://chat.whatsapp.com/FsRBfyPWiNNGQheGHeum5c',
  1,
  65,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
),
(
  'inglesconliza:escalera:dm:66:0',
  'inglesconliza',
  'escalera',
  '💬 una de las respuestas es: I’m going down the stairs
 Te espero en mi grupo para más tips, cupos limitados: https://chat.whatsapp.com/FsRBfyPWiNNGQheGHeum5c',
  1,
  66,
  '2026-04-28T16:57:02.161Z',
  'components/slack/MECH.md'
);
