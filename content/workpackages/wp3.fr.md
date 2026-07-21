---
title: "Flow matching sur les variétés"
layout: wp
nav: wp
weight: 3
num: "WP 3"
members: "G. Ginolhac · Y. Mhiri · N. Le Bihan · F. Chatelain"
card: "Des modèles génératifs riemanniens pour débruiter l'imagerie SAR, interpoler ou prédire des images entre deux dates d'acquisition."
---

## Motivation

Les modèles génératifs — diffusion, flow matching — tiennent rarement compte des contraintes que les données doivent satisfaire. Or des résultats récents montrent l'intérêt de construire les flots directement sur la variété où vivent les données. Cet axe développe des modèles de flow matching pour les variétés au cœur de GEOMETRY — tore, matrices SPD, Stiefel et Grassmann — avec des outils géométriques légers pour rester utilisables en pratique.

## Trois applications

- **Génération de données réalistes.** Apprendre le flot entre le bruit et des images réelles — InSAR, SAR à partir de matrices SPD, multispectral à partir de projecteurs — pour produire des données de test pour les algorithmes des WP1 et WP2.
- **Débruitage.** Apprendre le flot entre image bruitée et image propre, pour l'InSAR (très bruité aux longues bases temporelles) et le speckle SAR. Validation : débruiter des séries Sentinel-1 et comparer aux acquisitions TerraSAR-X des mêmes volcans, disponibles via la collaboration avec l'ONERA.
- **Interpolation — et prédiction.** Des intervalles de revisite de 6 à 12 jours sont souvent trop grossiers. Apprendre le flot entre deux dates successives pourrait créer une image intermédiaire — et, si les résultats sont convaincants, prédire la suivante : précieux pour la surveillance des sites à risque.
