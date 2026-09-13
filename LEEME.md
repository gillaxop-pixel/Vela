# Vela — Lista para desplegar (sin Grok)

## Cambios realizados
- Chat usa **Groq** (variable: GROQ_API_KEY)
- Imágenes usan **Pollinations** (gratis, sin key)
- Diseño original intacto

## Cómo desplegar

1. Sube **todo este proyecto** a un repositorio de GitHub
2. En Vercel → Importa el repo
3. Añade la variable de entorno:
   - Name: `GROQ_API_KEY`
   - Value: tu clave de https://console.groq.com
4. Deploy

## Después (para APK)
Cuando tengas la URL de Vercel, ve a https://www.pwabuilder.com
pega la URL y genera el APK de Android.
