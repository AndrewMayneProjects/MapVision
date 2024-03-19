from flask import Flask, request, jsonify, send_from_directory, render_template
import requests
from flask_cors import CORS
import os
from werkzeug.utils import secure_filename
from base64 import b64decode
from openai import OpenAI
from dotenv import load_dotenv
import json
import base64
import re
from datetime import datetime


app = Flask(__name__, static_folder='static', template_folder='templates')
CORS(app)

# Ensure there's a directory for temporary storage of uploaded files
UPLOAD_FOLDER = 'tmp'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)
    

   

def getCompletion(text, image_path, detail='auto'):
    
    
    # OpenAI API Key
    api_key = os.environ.get("OPENAI_API_KEY")

    # Function to encode the image
    def encode_image(image_path):
        with open(image_path, "rb") as image_file:
            return base64.b64encode(image_file.read()).decode('utf-8')


    # Getting the base64 string
    base64_image = encode_image(image_path)

    headers = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {api_key}"
    }

    payload = {
    "model": "gpt-4-vision-preview",
    "messages": [
        {
        "role": "user",
        "content": [
            {
            "type": "text",
            "text": text
            },
            {
            "type": "image_url",
            "image_url": {
                "url": f"data:image/jpeg;base64,{base64_image}",
                "detail": detail,
            }
            }
        ]
        }
    ],
    "max_tokens": 500
    }
    
    
    response = requests.post(
        "https://api.openai.com/v1/chat/completions", headers=headers, json=payload
    )

    json_data = response.json()

    print(json_data)
    
    total_tokens = json_data["usage"]["total_tokens"]

    input_str = json_data["choices"][0]["message"]["content"] # + "<br><br>Total tokens: " + str(total_tokens)
    
    print("*" * 100)
    print(input_str)
    print("*" * 100)

    return input_str



 

@app.route('/')
def index():
    # Serve the index.html file
    return render_template('index.html')

@app.route('/vision', methods=['POST'])
def vision():
    if 'image' not in request.files:
        return jsonify({"error": "No image part"}), 400
    file = request.files['image']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
    if file:
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        # Process the uploaded image and text fields
        text = request.form.get('prompt', '')
        detail = request.form.get('detail', 'auto')
        
        print("Text:", text)
    
        
        response = getCompletion(text, filepath, detail)
        
        
        return jsonify({"message": "File uploaded and processed", "filename": filename , "completion": response}), 200

if __name__ == "__main__":
    app.run(debug=True, port=5007)
    
    
    
 