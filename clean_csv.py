import pandas as pd
import glob

# Folder path jahan sab CSV files hain
files = glob.glob(r"C:\Users\HP\OneDrive\Dokumen\Desktop\project\cleaned_all_states.csv")   # change path if needed

all_data = []

for file in files:
    df = pd.read_csv(file)

    # Sirf required columns select karo
    df = df[
        [
            "STATE NAME",
            "DISTRICT NAME",
            "SUB-DISTRICT NAME",
            "Area Name",
        ]
    ]

    # Column rename karo
    df.columns = [
        "state",
        "district",
        "sub_district",
        "village",
    ]

    all_data.append(df)

# Sab files ko merge karo
final_df = pd.concat(all_data, ignore_index=True)

# Empty rows remove karo
final_df = final_df.dropna()

# Final CSV save karo
final_df.to_csv("cleaned_all_states.csv", index=False)

print("Cleaning Done Successfully")