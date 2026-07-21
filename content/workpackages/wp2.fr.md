---
title: "Nouveaux modèles d'apprentissage géométriques"
layout: wp
nav: wp
weight: 2
num: "WP 2"
members: "F. Chatelain · G. Ginolhac · N. Le Bihan · A. Mian"
card: "Étendre SPDNet aux architectures transformer pour la dimension temporelle, et à l'apprentissage fédéré pour les données multimodales."
---

## Motivation

SPDNet a permis de construire des réseaux de neurones directement sur les matrices de covariance, avec une robustesse remarquable sur des jeux de données petits et très variables. Mais son architecture précède l'ère des transformers : elle ne gère ni la dimension temporelle ni la multimodalité des données modernes de télédétection. Cet axe développe deux successeurs.

## Transformer SPDNet

Un transformer dont chaque ingrédient est reconstruit pour des séquences de matrices SPD : encodage positionnel inspiré du groupe de Siegel ; scores d'attention fondés sur la métrique riemannienne et les angles riemanniens (ou les vecteurs de Fisher) plutôt que sur des distances log-euclidiennes ; séquences de sortie calculées avec des centres mieux adaptés comme le barycentre de Kullback–Leibler symétrisé ; normalisations par déterminant ou trace. La théorie des matrices aléatoires aidera à maîtriser la grande dimension.

<span style="color:var(--muted)">Évaluation : classification sémantique sur des jeux de données temporels de télédétection, et détection de changement sur UAVSAR.</span>

## Federated SPDNet

Plutôt que de fusionner toutes les modalités sur un seul serveur, les modèles sont entraînés sur des clients séparés qui n'échangent que leurs coefficients — un cadre naturel pour des modèles géométriques légers. L'ingrédient clé est le calcul direct et peu coûteux, sur le serveur central, de barycentres des coefficients de SPDNet sur la variété de Stiefel. Une seconde piste étend le pipeline aux modalités hétérogènes — matrices de covariance de tailles et de significations différentes (spectro-angulaire en SAR, spectrale en multi/hyperspectral) — via les variétés lisses compactes et l'imputation de données.

<span style="color:var(--muted)">Évaluation : jeux de données multimodaux réels de télédétection.</span>
