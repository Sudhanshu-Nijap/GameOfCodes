import tkinter as tk
from tkinter import filedialog, messagebox
from PIL import Image, ImageTk
import os
import main  # Import our core logic

class StegoApp:
    def __init__(self, root):
        self.root = root
        self.root.title("StegoReveal Desktop")
        self.root.geometry("600x500")
        self.root.configure(bg="#05070a")
        
        self.image_path = None
        
        # Styles
        self.accent = "#00f2ff"
        self.font = ("Inter", 10)
        
        self.setup_ui()

    def setup_ui(self):
        tk.Label(self.root, text="STEGOREVEAL", font=("Inter", 24, "bold"), fg=self.accent, bg="#05070a").pack(pady=20)
        
        self.btn_select = tk.Button(self.root, text="Select Image", command=self.select_image, bg="#1a1a1a", fg="white", pady=10, padx=20, border=0)
        self.btn_select.pack(pady=10)
        
        self.lbl_path = tk.Label(self.root, text="No image selected", fg="#7d8590", bg="#05070a")
        self.lbl_path.pack()
        
        self.txt_msg = tk.Text(self.root, height=5, width=50, bg="#0d1117", fg="white", insertbackground="white")
        self.txt_msg.pack(pady=20)
        self.txt_msg.insert(1.0, "Enter message to hide...")
        
        btn_frame = tk.Frame(self.root, bg="#05070a")
        btn_frame.pack(pady=10)
        
        tk.Button(btn_frame, text="Hide Message", command=self.hide, bg=self.accent, fg="black", width=15).pack(side=tk.LEFT, padx=10)
        tk.Button(btn_frame, text="Reveal Message", command=self.reveal, bg="#7d8590", fg="black", width=15).pack(side=tk.LEFT, padx=10)

    def select_image(self):
        self.image_path = filedialog.askopenfilename(filetypes=[("Image files", "*.png *.jpg *.jpeg")])
        if self.image_path:
            self.lbl_path.config(text=os.path.basename(self.image_path))

    def hide(self):
        if not self.image_path:
            messagebox.showerror("Error", "Please select an image first.")
            return
        msg = self.txt_msg.get(1.0, tk.END).strip()
        if not msg:
            messagebox.showerror("Error", "Please enter a message.")
            return
            
        out_path = filedialog.asksaveasfilename(defaultextension=".png")
        if out_path:
            try:
                main.encode(self.image_path, msg, out_path)
                messagebox.showinfo("Success", f"Secret saved to {out_path}")
            except Exception as e:
                messagebox.showerror("Error", str(e))

    def reveal(self):
        if not self.image_path:
            messagebox.showerror("Error", "Please select an image first.")
            return
        try:
            result = main.decode(self.image_path)
            self.txt_msg.delete(1.0, tk.END)
            self.txt_msg.insert(1.0, result)
            messagebox.showinfo("Decoded", "Message revealed in text box!")
        except Exception as e:
            messagebox.showerror("Error", str(e))

if __name__ == "__main__":
    root = tk.Tk()
    app = StegoApp(root)
    root.mainloop()
