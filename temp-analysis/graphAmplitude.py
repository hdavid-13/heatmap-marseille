
import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.dates as mdates

# Charger le fichier complet
data = pd.read_csv("marseille_complet.csv", parse_dates=["DATE"])
data["TAMPLI"] = pd.to_numeric(data["TAMPLI"], errors="coerce")
data = data[["DATE", "TAMPLI"]].dropna().sort_values("DATE")

# Le reste du script est identique...

# Moyenne glissante 30 jours pour lisibilité
data["TAMPLI_smooth"] = data["TAMPLI"].rolling(window=30, center=True).mean()

# Moyenne annuelle
annual = data.groupby(data["DATE"].dt.year)["TAMPLI"].mean()

fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(14, 8), gridspec_kw={"height_ratios": [3, 1]})
fig.suptitle("Amplitude thermique jour/nuit — Marignane", fontsize=14, fontweight="bold")

# Graphique principal
ax1.plot(data["DATE"], data["TAMPLI"], color="#d0d0d0", linewidth=0.4, alpha=0.7, label="Quotidien")
ax1.plot(data["DATE"], data["TAMPLI_smooth"], color="#e05c2a", linewidth=1.5, label="Moyenne 30 jours")
ax1.set_ylabel("Amplitude (°C)")
ax1.set_xlim(data["DATE"].min(), data["DATE"].max())
ax1.xaxis.set_major_formatter(mdates.DateFormatter("%Y"))
ax1.xaxis.set_major_locator(mdates.YearLocator(2))
ax1.legend()
ax1.grid(axis="y", alpha=0.3)

# Moyenne annuelle
ax2.bar(annual.index, annual.values, color="#e05c2a", alpha=0.8, width=0.7)
ax2.set_ylabel("Moy. annuelle (°C)")
ax2.set_xlabel("Année")
ax2.grid(axis="y", alpha=0.3)

plt.tight_layout()
plt.savefig("./graph_output/amplitude_jour_nuit.png", dpi=150, bbox_inches="tight")
plt.show()
print("Graphique sauvegardé : amplitude_jour_nuit.png")