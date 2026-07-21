---
title: "Descripteurs géométriques invariants pour l'InSAR et le PolInSAR"
layout: wp
nav: wp
weight: 1
num: "WP 1"
members: "N. Le Bihan · A. Mian · P.-O. Amblard · G. Ginolhac"
card: "Les phases géométriques comme signatures invariantes de jauge et de basse dimension des déplacements du sol — glaciers, volcans, subsidence."
---

## Motivation

L'InSAR et le PolInSAR suivent les déplacements du sol — fonte des glaciers, glissements de terrain, déformations volcaniques — en suivant dans le temps la phase d'interférence des images SAR. Des études récentes ont révélé une incohérence de phase surprenante : les phases moyennées sur trois images cohérentes peuvent s'écarter sensiblement de la triangularité, biaisant l'estimation des déplacements. Ce phénomène n'a jamais été étudié dans le cadre multivarié, plus riche, du PolInSAR.

Notre hypothèse : correctement caractérisées par le concept de <em>phase géométrique</em> — introduit par Berry pour les systèmes quantiques, récemment étendu aux signaux bivariés — ces incohérences cessent d'être une nuisance et deviennent un descripteur discriminant de la nature du déplacement.

## Pistes de recherche

- **Les phases géométriques comme descripteurs.** La phase accumulée par un signal multivarié le long de sa trajectoire dans l'espace projectif complexe est invariante de jauge et de reparamétrisation — exactement les invariances requises pour une classification robuste aux configurations d'acquisition et aux bases temporelles.
- **Une hiérarchie de phases non commutatives.** Des phases de dimension supérieure, vivant sur des variétés de Stiefel et calculées dans des sous-espaces emboîtés, fournissent un jeu multi-échelle de k+1 descripteurs — dans l'esprit de la méthode des signatures, pour une fraction de son coût de calcul.
- **Métriques et barycentres.** Définir des métriques de faible complexité sur ce nouvel espace de descripteurs, avec des versions adaptées d'algorithmes classiques (k-means et au-delà) opérant intrinsèquement sur cet espace.

## Applications et données

Classification des types de déplacement — écoulement glaciaire, déformation volcanique, subsidence urbaine, dynamique de la végétation — sur des séquences InSAR et PolInSAR, dont des jeux de données sur Mexico et plusieurs volcans disponibles via des collaborations existantes.
