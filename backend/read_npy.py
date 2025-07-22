import numpy as np
import sys

path = r'C:\Users\Admin\Desktop\IA2\wilA\backend\uploads\signatures\signatures_exam_1.npy'

try:
    data = np.load(path, allow_pickle=True)
    print("Contenu du fichier .npy :")
    print(data)
    print("\nInformations sur le tableau :")
    print(f"  - Forme (dimensions) : {data.shape}")
    print(f"  - Type de donnees : {data.dtype}")
except FileNotFoundError:
    print(f"Erreur : Le fichier '{path}' n'a pas ete trouve.", file=sys.stderr)
except Exception as e:
    print(f"Une erreur est survenue : {e}", file=sys.stderr)
