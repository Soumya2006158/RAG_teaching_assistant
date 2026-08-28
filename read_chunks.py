# import requests
# import os
# import jsons

# def create_embedding(text): 

#     r=requests.post("http://localhost:11434/api/embeddings", json={"model":"bge-m3",
#     "prompt": text
#     })

#     embedding= r.json()['embedding']
#     return embedding

# json = os.listdir("jsons")

# for json_file in json_files:
#     with open(f"jsons/{json_file}") as f:
#         content=json.load(f)
#     for chunk in content['chunks']:
#         print(chunk)
#     break

# # a= create_embedding("Sini got angry on me")
# # print(a)


import os
import json
import requests 
import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity


def create_embedding(text_list):
    r = requests.post(
        "http://localhost:11434/api/embed",
        json={
            "model": "bge-m3",
            "input": text_list
        }
    )

    embedding = r.json()["embeddings"]

    return embedding


json_files = os.listdir("jsons")
my_dicts=[]
chunk_id=0

for json_file in json_files:
    with open(f"jsons/{json_file}", "r") as f:
        content = json.load(f)
    print(f"creating embeddings for {json_file}")
    embeddings= create_embedding([c['text'] for c in content['chunks']])


    for i, chunk in enumerate(content["chunks"]):
        print(chunk)
        chunk['chunk_id']=chunk_id
        chunk['embedding']=embeddings[i]
        chunk_id +=1
        my_dicts.append(chunk)
        if(i==5): #Read 5chunks for now
            break
    break

# print(my_dicts)

df=pd.DataFrame.from_records(my_dicts)
print(df)

incoming_query=input("Ask a Question:")
question_embedding=create_embedding([incoming_query])[0]
print(question_embedding)

similarities= cosine_similarity(df['embedding'].values, [incoming_query])

# print(a)