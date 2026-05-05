import os
from gradio_client import Client, handle_file

try:
    client = Client("yisol/IDM-VTON")
    # Need some dummy files
    with open("dummy_person.jpg", "wb") as f: f.write(b"")
    with open("dummy_garm.jpg", "wb") as f: f.write(b"")

    # Try passing dict for person_img
    person_img_input = {
        "background": handle_file("dummy_person.jpg"),
        "layers": [],
        "composite": None
    }

    result = client.predict(
        dict=person_img_input,
        garm_img=handle_file("dummy_garm.jpg"),
        garment_des="a simple t-shirt",
        is_checked=True,
        is_checked_crop=False,
        denoise_steps=30,
        seed=42,
        api_name="/tryon"
    )
    print("Success:", result)
except Exception as e:
    print("Error:", e)
finally:
    if os.path.exists("dummy_person.jpg"): os.remove("dummy_person.jpg")
    if os.path.exists("dummy_garm.jpg"): os.remove("dummy_garm.jpg")
