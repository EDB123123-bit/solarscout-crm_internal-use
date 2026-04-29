export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return new Response('Not found', { status: 404 })
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Trigger Send</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; max-width: 600px; margin: 0 auto; }
        button { padding: 12px 24px; font-size: 16px; cursor: pointer; background: #007bff; color: white; border: none; border-radius: 5px; }
        button:hover { background: #0056b3; }
        pre { background: #f0f0f0; padding: 15px; border-radius: 5px; overflow: auto; }
        input { padding: 8px; font-size: 14px; width: 300px; border: 1px solid #ccc; border-radius: 4px; }
        .input-group { margin-bottom: 20px; }
        label { display: block; margin-bottom: 8px; font-weight: bold; }
      </style>
    </head>
    <body>
      <h1>Trigger Send</h1>
      <div class="input-group">
        <label for="secret">Enter your CRON_SECRET:</label>
        <input type="text" id="secret" placeholder="Paste your secret here" />
      </div>
      <button onclick="triggerSend()">Click to Trigger Send</button>
      <pre id="result"></pre>
      <script>
        async function triggerSend() {
          const secret = document.getElementById('secret').value
          if (!secret) {
            alert('Please paste your CRON_SECRET in the input field')
            return
          }

          document.getElementById('result').textContent = 'Sending...'

          try {
            const res = await fetch('/api/send', {
              method: 'POST',
              headers: {
                'Authorization': 'Bearer ' + secret,
                'Content-Type': 'application/json'
              },
              body: '{}'
            })
            const data = await res.json()
            document.getElementById('result').textContent = JSON.stringify(data, null, 2)
          } catch (err) {
            document.getElementById('result').textContent = 'Error: ' + err.message
          }
        }
      </script>
    </body>
    </html>
  `

  return new Response(html, {
    headers: { 'Content-Type': 'text/html' }
  })
}
