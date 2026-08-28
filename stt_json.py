import whisper
import json

model = whisper.load_model("large-v2")

result = model.transcribe(audio = "audio/sample2.mp3",
                          language="hi",
                          task="translate",
                          word_timestamps=False)

#print(result["segments"])
# with open("output.json","w") as f :
#    json.dump(f, result)

chunks=[]

for segment in result["segments"]:
    chunks.append({"start": segment["start"], "end":segment["end"], "text": segment["text"]})

print(chunks)

with open("output2.json","w") as f:
    json.dump(chunks,f)