import pandas as pd
import os

# folder path
folder_path = r"C:\Users\HP\OneDrive\Dokumen\Desktop\project\dataset"

# empty list to store data
all_data = []

# loop through all files
for file in os.listdir(folder_path):

    if file.endswith(".xls") or file.endswith(".xlsx"):

        file_path = os.path.join(folder_path, file)

        print("Processing:", file)

        # read excel
        df = pd.read_excel(file_path)

        # basic cleaning
        df.dropna(inplace=True)

        # remove spaces
        df.columns = df.columns.str.strip()

        # optional: add state column from filename
        state_name = file.split("_")[-1].replace(".xlsx", "")
        df["state"] = state_name

        # append to list
        all_data.append(df)

# merge all data
final_df = pd.concat(all_data, ignore_index=True)

# save cleaned data
final_df.to_csv("cleaned_all_states.csv", index=False)

print("All files cleaned and merged successfully!")