from flask import Flask, request, jsonify
import subprocess

app = Flask("Llama server")

@app.route('/llama', methods=['POST'])
def generate_response():
    data = request.get_json()
    user_input = data.get('input', '')

    # Use Ollama CLI to run the LLaMA model
    result = subprocess.run(
        ["ollama", "run", "meta-llama/Llama-2-7b-chat-hf", user_input],
        capture_output=True,
        text=True
    )

    response_text = result.stdout.strip()
    return jsonify({"response": response_text})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
