import whisper

model = whisper.load_model("large-v2")

result = model.transcribe(audio = "audio/1_1.mp3",
                          language="hi",
                          task="translate")

print(result)
