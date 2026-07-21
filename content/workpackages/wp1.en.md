---
title: "Geometric invariant features for InSAR & PolInSAR"
layout: wp
nav: wp
weight: 1
num: "WP 1"
members: "N. Le Bihan · A. Mian · P.-O. Amblard · G. Ginolhac"
card: "Geometric phases as low-dimensional, gauge-invariant signatures of ground displacement — glaciers, volcanoes, subsidence."
---

## Motivation

InSAR and PolInSAR track ground displacement — glacier melt, landslides, volcanic deformation — by following the phase of interfering SAR images over time. Recent studies revealed a puzzling phase inconsistency: phases averaged over three coherent images can deviate significantly from triangularity, biasing displacement estimates. This phenomenon has never been studied in the richer multivariate PolInSAR setting.

Our hypothesis: properly characterized through the concept of <em>geometric phase</em> — introduced by Berry for quantum systems, recently extended to bivariate signals — these inconsistencies stop being a nuisance and become a discriminative feature of the nature of ground displacement.

## Research directions

- **Geometric phases as features.** The phase accumulated by a multivariate signal along its trajectory in complex projective space is gauge-invariant and reparametrization-invariant — exactly the invariances needed for robust classification across acquisition configurations and temporal baselines.
- **A hierarchy of non-commutative phases.** Higher-dimensional phases living on Stiefel manifolds, computed in nested subspaces, yield a multi-scale set of k+1 features — in the spirit of the signature method, at a fraction of its computational cost.
- **Metrics and barycenters.** Defining low-complexity metrics on this new feature space, with adapted versions of classical ML algorithms (k-means and beyond) operating intrinsically on it.

## Applications & data

Classification of displacement types — glacial flow, volcanic deformation, urban subsidence, vegetation dynamics — on InSAR and PolInSAR image sequences, including datasets over Mexico City and several volcanoes available through existing collaborations.
