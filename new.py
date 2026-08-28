import os
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"

import whisper
import json

model = whisper.load_model("large-v2")

audios = os.listdir("audios")

for audio in audios:
      #  print(audio)
      if("_" in audio):
            number = audio.split("_")[0]
            title = audio.split("_")[1][:-4]
            print(number, title)
            # result = model.transcribe(audio= f"audios/{audio}.mp3",
            result = model.transcribe(audio= f"audio/output.mp3",
                          language="hi",
                          task="translate",
                          word_timestamps= False)

chunks = []
for segment in result["segments"]:
  chunks.append({"number":number,"title":title,"start": segment["start"],"end": segment["end"],"text": segment["text"] })

chunks_with_metadata ={"chunks":chunks, "text":result["text"]}


with open(f"jsons/{audio}.json","w") as f:
  json.dump(chunks_with_metadata,f)

# import whisper
# import json
# import os
# os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"

# model = whisper.load_model("large-v2")

# audios = os.listdir("audio")

# for audio in audios: 
#     print(audio)
    
#     if("_" in audio):
#         number = audio.split("_")[0]
#         title = audio.split("_")[1][:-4]
#         print(number, title)
#         #result = model.transcribe(audio = f"audios/{audio}", 
#         result = model.transcribe(audio = f"audios/output.mp3", 
#                               language="hi",
#                               task="translate",
#                               word_timestamps=False )
        
#         chunks = []
#         for segment in result["segments"]:
#             chunks.append({"number": number, "title":title, "start": segment["start"], "end": segment["end"], "text": segment["text"]})
        
#         chunks_with_metadata = {"chunks": chunks, "text": result["text"]}



#         with open(f"jsons/{audio}.json", "w") as f:
#             json.dump(chunks_with_metadata,f)

# print(chunks_with_metadata)