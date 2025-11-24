import os

EXCLUDED_DIRS = {"node_modules", ".git", "dist", "__pycache__", ".vscode", "package-lock.json"}

def combine_all_files(root_dir=".", output_file="all_code.txt"):
    with open(output_file, "w", encoding="utf-8") as outfile:
        for subdir, dirs, files in os.walk(root_dir):
            # Skip directories
            dirs[:] = [d for d in dirs if d not in EXCLUDED_DIRS]

            for file in files:
                file_path = os.path.join(subdir, file)

                # Skip output file itself
                if file_path.endswith(output_file):
                    continue

                # Readable text files only
                try:
                    with open(file_path, "r", encoding="utf-8") as infile:
                        outfile.write(f"{'='*40}\n")
                        outfile.write(f"FILE: {file_path}\n")
                        outfile.write(f"{'='*40}\n\n")
                        outfile.write(infile.read())
                        outfile.write("\n\n")
                    print(f"Added: {file_path}")
                except:
                    print(f"Skipped (binary or unreadable): {file_path}")

    print(f"\nAll files successfully combined into: {output_file}")


if __name__ == "__main__":
    combine_all_files()
