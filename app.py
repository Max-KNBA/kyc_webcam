from flask import Flask, request, jsonify, render_template
from PIL import Image
import io
import os

app = Flask(__name__)

@app.route('/')
def kyc_start():
    return render_template('kyc_web.html')


@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    try:
        # Open the image file
        image = Image.open(file.stream)

        # Convert image to JPEG
        img_io = io.BytesIO()
        image.save(img_io, 'JPEG', quality=85)
        img_io.seek(0)

        # Save the image to the 'upload' directory
        upload_dir = 'upload'
        os.makedirs(upload_dir, exist_ok=True)  # Create the directory if it doesn't exist
        file_path = os.path.join(upload_dir, file.filename)
        with open(file_path, 'wb') as f:
            f.write(img_io.getvalue())

        return jsonify({'message': 'File uploaded and converted to JPEG successfully'}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
