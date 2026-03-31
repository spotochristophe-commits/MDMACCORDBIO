# 🌿 BIO N TRUFFE — CRM Kit Revendeurs

> Kit CRM bon de commande revendeurs — épicerie fine à la truffe, palette Vert & Beige.

---

## 📁 Structure du kit

```
bio-n-truffe/
├── index.html       → Portail d'accueil
├── admin.html       → Back-office (catalogue, catégories, revendeurs, config)
├── commande.html    → Bon de commande revendeur
├── config.json      → Configuration complète
└── README.md        → Ce fichier
```

---

## 🚀 Démarrage rapide

1. Déposez les 5 fichiers dans un même dossier (serveur HTTP)
2. Ouvrez `admin.html` pour configurer le catalogue et les revendeurs
3. Partagez `commande.html` à vos revendeurs

> ⚠️ Servir via HTTP (pas en `file://`). Utilisez [Netlify Drop](https://app.netlify.com/drop) pour un déploiement instantané.

---

## 🎨 Identité visuelle

| Élément | Valeur |
|---|---|
| Palette | Vert forêt `#2d4a2d` + Beige `#c4a882` + Crème `#f5f0e8` |
| Typographies | Libre Baskerville (titres) + Lato (corps) |
| Univers | Bio, nature, épicerie fine, terroir |

---

## 🛒 Catalogue par défaut (19 produits)

| Catégorie | Produits |
|---|---|
| Huiles & Condiments | Huiles d'olive, vinaigre balsamique, sels truffés |
| Pâtes & Sauces | Pâtes de truffe, sauces, tapenade, beurre truffé |
| Féculents & Épicerie | Pâtes, risotto, polenta, miel, chips |
| Fromages & Charcuterie | Saucisson sec, foie gras à la truffe |
| Coffrets Cadeaux | Découverte, Prestige, Box mensuelle |

---

## ⚙️ Back-office (`admin.html`)

- **Dashboard** : stats produits, catégories, revendeurs, prix moyen
- **Produits** : ajouter / modifier / supprimer
- **Catégories** : créer et organiser
- **Revendeurs** : profils avec remises globales et par catégorie
- **Configuration** : société, email, conditions commerciales
- **JSON Brut** : visualiser, copier, télécharger `config.json`

---

## 📌 Conditions par défaut

| Paramètre | Valeur |
|---|---|
| Minimum commande | 150 € HT |
| Franco de port | 500 € HT |
| Délai livraison | 3 à 5 jours ouvrés |
| Conditions paiement | 30 jours fin de mois |

---

*Version 1.0.0 — Mars 2026 — Propulsé par MDM BDC 26*
