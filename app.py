from flask import Flask, render_template, request, jsonify
import requests
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__, template_folder='templates', static_folder='static')

# Configuration
GROQ_API_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions'
GROQ_API_KEY = os.getenv('GROQ_API_KEY')  # Store your API key in a .env file

# Initial system prompt
chat_history = [
    {
        "role": "system",
        "content": "You are InsurAI, an insurance specialist assistant. Provide helpful information about insurance plans and coverage options. Try ro keep things a little short and only give elobarated answers that is of 12 lines max when it is required"
    }
]

@app.route('/')
def index():
    return render_template('homepage.html')

@app.route('/chatbot')
def chatbot():
    return render_template('chatbot.html')

@app.route('/api/chat', methods=['POST'])
def chat():
    global chat_history
    
    try:
        data = request.json
        user_message = data.get('message', '')
        
        # Add user message to chat history
        chat_history.append({"role": "user", "content": user_message})
        
        # Call Groq API
        response = requests.post(
            GROQ_API_ENDPOINT,
            headers={
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {GROQ_API_KEY}'
            },
            json={
                'model': 'llama3-8b-8192',
                'messages': chat_history,
                'temperature': 0.5,
                'max_tokens': 800
            }
        )
        
        if not response.ok:
            raise Exception(f"API error: {response.status_code} - {response.text}")
        
        result = response.json()
        ai_response = result['choices'][0]['message']['content']
        
        # Add AI response to history and limit size
        chat_history.append({"role": "assistant", "content": ai_response})
        
        if len(chat_history) > 12:
            chat_history = [
                chat_history[0],  # Keep system prompt
                *chat_history[-10:]  # Keep last 10 messages
            ]
        
        return jsonify({
            'status': 'success',
            'message': ai_response
        })
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': "I'm having trouble connecting right now. Please try again later."
        }), 500

if __name__ == '__main__':
    app.run(debug=True)