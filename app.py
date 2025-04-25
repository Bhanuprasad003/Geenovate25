from flask import Flask, render_template, request, jsonify
import requests
import os
import tempfile
from werkzeug.utils import secure_filename
from dotenv import load_dotenv
import PyPDF2
import re

# Load environment variables
load_dotenv()

app = Flask(__name__, template_folder='templates', static_folder='static')

# Configuration
GROQ_API_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions'
GROQ_API_KEY = os.getenv('GROQ_API_KEY')  # Store your API key in a .env file

# Set upload configuration
app.config['UPLOAD_FOLDER'] = tempfile.gettempdir()
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB limit

# Initial system prompt
chat_history = [
    {
        "role": "system",
        "content": "You are InsurAI, an insurance specialist assistant. Provide helpful information about insurance plans and coverage options. Try to keep things a little short and only give elaborated answers that is of 12 lines max when it is required"
    }
]

# PDF analysis prompt template
PDF_ANALYSIS_TEMPLATE = """
You are InsurAI, an expert in analyzing insurance documents. I'm going to provide you with text extracted from an insurance document. Please analyze it carefully and provide the following:

1. Document type (policy, quote, claim, etc.)
2. Insurance type (auto, home, health, life, etc.)
3. Key dates (effective date, expiration date)
4. Coverage amounts and limits
5. Premium information
6. Important exclusions or conditions
7. Any notable gaps in coverage

Here's the text extracted from the document:
{pdf_text}

Provide a concise, easy-to-understand summary of the document with the most important details a policyholder should know. Keep your response under 12 lines. If any critical information appears to be missing, please note that as well.
"""

def extract_text_from_pdf(pdf_path):
    """Extract text from a PDF file."""
    try:
        text = ""
        with open(pdf_path, 'rb') as file:
            reader = PyPDF2.PdfReader(file)
            for page_num in range(len(reader.pages)):
                page = reader.pages[page_num]
                text += page.extract_text() + "\n\n"
                
        # Clean up the text (remove excessive whitespace, etc.)
        text = re.sub(r'\s+', ' ', text).strip()
        return text
    except Exception as e:
        print(f"Error extracting text from PDF: {str(e)}")
        return None

def send_to_llm(prompt):
    """Send prompt to Groq API and get response."""
    try:
        response = requests.post(
            GROQ_API_ENDPOINT,
            headers={
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {GROQ_API_KEY}'
            },
            json={
                'model': 'llama3-8b-8192',
                'messages': [{"role": "user", "content": prompt}],
                'temperature': 0.5,
                'max_tokens': 800
            }
        )
        
        if not response.ok:
            raise Exception(f"API error: {response.status_code} - {response.text}")
        
        result = response.json()
        return result['choices'][0]['message']['content']
    except Exception as e:
        print(f"LLM API error: {str(e)}")
        return f"I encountered an error while analyzing the document. Error details: {str(e)}"

@app.route('/')
def index():
    return render_template('homepage.html')

@app.route('/chatbot')
def chatbot():
    return render_template('chatbot.html')

@app.route('/marketplace')
def marketplace():
    return render_template('marketplace.html')

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

@app.route('/api/process-pdf', methods=['POST'])
def process_pdf():
    try:
        if 'pdf' not in request.files:
            return jsonify({"status": "error", "message": "No file provided"})
            
        file = request.files['pdf']
        
        if file.filename == '':
            return jsonify({"status": "error", "message": "No file selected"})
            
        if file and file.filename.endswith('.pdf'):
            # Save the file temporarily
            temp_path = os.path.join(app.config['UPLOAD_FOLDER'], secure_filename(file.filename))
            file.save(temp_path)
            
            # Extract text from PDF
            pdf_text = extract_text_from_pdf(temp_path)
            
            if not pdf_text or pdf_text.strip() == "":
                os.remove(temp_path)
                return jsonify({
                    "status": "error", 
                    "message": "Could not extract text from the PDF. The file may be encrypted, password-protected, or contain only images."
                })
            
            # Create prompt with PDF text as context
            prompt = PDF_ANALYSIS_TEMPLATE.format(pdf_text=pdf_text)
            
            # Send to LLM for analysis
            analysis_result = send_to_llm(prompt)
            
            # Clean up the temporary file
            os.remove(temp_path)
            
            return jsonify({
                "status": "success",
                "message": analysis_result
            })
        
        return jsonify({"status": "error", "message": "Invalid file format"})
    
    except Exception as e:
        print(f"PDF processing error: {str(e)}")
        return jsonify({
            "status": "error", 
            "message": "An error occurred while processing your PDF file. Please try again later."
        }), 500

if __name__ == '__main__':
    app.run(debug=True)