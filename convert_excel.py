import pandas as pd
import sys
import os

def convert(input_file):
    output_prefix = os.path.splitext(input_file)[0]
    try:
        xls = pd.ExcelFile(input_file)
        for sheet_name in xls.sheet_names:
            df = pd.read_excel(xls, sheet_name=sheet_name)
            output_file = f"{output_prefix}_{sheet_name}.csv" if len(xls.sheet_names) > 1 else f"{output_prefix}.csv"
            df.to_csv(output_file, index=False, encoding='utf-8-sig')
            try:
                print(f"Saved: {output_file}".encode('utf-8').decode('cp1252', 'ignore'))
            except Exception:
                print("Saved a file (name contains unicode)")
    except Exception as e:
        print(f"Error during conversion: {e}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python convert_excel.py <input.xlsx>")
    else:
        convert(sys.argv[1])
