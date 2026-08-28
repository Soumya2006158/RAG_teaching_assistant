import os
import subprocess

files = os.listdir("video")
print(files)

# for file in files :
#   print(file)a
#   tutorial_number = file.split(" [")[0].split(" #")[1]

ffmpeg = r"C:\Program Files (x86)\ffmpeg\bin\ffmpeg.exe"

for file_number, file in enumerate(files, start=1):
    file_name = file.split(".")[0]
    print(file_number, file_name)
    subprocess.run(["ffmpeg", "-i",f"video/{file}", f"audio/{file_number}_{file_name}.mp3"]) 