from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import cv2
import numpy as np
import base64
from io import BytesIO
from PIL import Image

# Import your masking/model code here
# from your_module import predict_crack_mask, fill_crack_areas_method2, clean_filled_areas

def dummy_mask(image):
    # --- Begin User's Crack Masking Logic ---
    import tensorflow as tf
    import numpy as np
    import cv2
    from keras.models import load_model
    from skimage.morphology import skeletonize
    from scipy.ndimage import binary_fill_holes

    PATCH_SIZE = 224
    THRESHOLD = 0.5
    SCALE = 0.1  # mm per pixel

    # Load your model (ensure model path is correct)
    model = load_model('fine_tuned_model.keras')  # Replace with your actual model path

    def refined_patch_mask(patch):
        gray = cv2.cvtColor(patch, cv2.COLOR_RGB2GRAY) if patch.shape[2] == 3 else patch
        mask = cv2.Canny(gray, 50, 150)
        return mask

    def predict_crack_mask(image, model, patch_size=PATCH_SIZE, threshold=THRESHOLD):
        H, W, C = image.shape
        mask = np.zeros((H, W), dtype=np.uint8)
        for i in range(0, H, patch_size):
            for j in range(0, W, patch_size):
                patch = image[i:min(i+patch_size, H), j:min(j+patch_size, W)]
                resized = cv2.resize(patch, (patch_size, patch_size))
                inp = tf.keras.applications.mobilenet_v2.preprocess_input(np.expand_dims(resized, axis=0))
                prob = model.predict(inp, verbose=0)[0][0]
                if prob > threshold:
                    patch_mask = refined_patch_mask(patch)
                    mask[i:i+patch.shape[0], j:j+patch.shape[1]] = np.maximum(mask[i:i+patch.shape[0], j:j+patch.shape[1]], patch_mask)
        return mask

    def fill_crack_areas_method2(edge_mask):
        kernel_close = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))
        closed = cv2.morphologyEx(edge_mask, cv2.MORPH_CLOSE, kernel_close, iterations=2)
        kernel_dilate = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
        thick_boundaries = cv2.dilate(closed, kernel_dilate, iterations=1)
        filled = binary_fill_holes(thick_boundaries > 0).astype(np.uint8) * 255
        return filled

    def clean_filled_areas(filled_mask, min_area=100):
        num_labels, labels, stats, _ = cv2.connectedComponentsWithStats(filled_mask, connectivity=8)
        cleaned = np.zeros_like(filled_mask)
        for i in range(1, num_labels):
            if stats[i, cv2.CC_STAT_AREA] >= min_area:
                component = (labels == i).astype(np.uint8) * 255
                cleaned = cv2.bitwise_or(cleaned, component)
        return cleaned

    # Run the full pipeline
    edge_mask = predict_crack_mask(image, model)
    filled = fill_crack_areas_method2(edge_mask)
    cleaned = clean_filled_areas(filled, min_area=50)

    # Overlay mask on original image
    overlay = image.copy()
    # Ensure mask is binary
    mask_bin = (cleaned > 0)
    # Overlay: red color where mask is present
    overlay[mask_bin] = (0.5 * overlay[mask_bin] + 0.5 * np.array([255, 0, 0])).astype(np.uint8)
    return overlay

app = FastAPI()

# Allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/crack-mask")
async def crack_mask(file: UploadFile = File(...)):
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    # Run your masking code here
    overlay = dummy_mask(image)
    pil_img = Image.fromarray(overlay)
    buf = BytesIO()
    pil_img.save(buf, format='PNG')
    overlay_base64 = base64.b64encode(buf.getvalue()).decode('utf-8')
    overlay_url = f"data:image/png;base64,{overlay_base64}"
    return JSONResponse({"mask_url": overlay_url})
