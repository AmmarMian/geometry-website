---
title: "Flow matching on manifolds"
layout: wp
nav: wp
weight: 3
num: "WP 3"
members: "G. Ginolhac · Y. Mhiri · N. Le Bihan · F. Chatelain"
card: "Riemannian generative models for denoising SAR imagery, and interpolating or predicting images between acquisition dates."
---

## Motivation

Generative models — diffusion, flow matching — rarely account for the constraints the data must satisfy. Yet recent results show the value of building flows directly on the manifold where the data live. This WP develops flow-matching models for the manifolds at the heart of GEOMETRY — torus, SPD matrices, Stiefel and Grassmann — using lightweight geometric tools so the models stay usable in practice.

## Three applications

- **Realistic data generation.** Learning the flow between noise and real images — InSAR, SAR from SPD matrices, multispectral from projectors — to produce test data for the algorithms of WP1 and WP2.
- **Denoising.** Learning the flow between noisy and clean images, for InSAR (very noisy at long temporal baselines) and SAR speckle. Validation: denoise Sentinel-1 series and compare against TerraSAR-X acquisitions of the same volcanoes, available through the collaboration with ONERA.
- **Interpolation — and prediction.** Revisit intervals of 6 to 12 days are often too coarse. Learning the flow between two successive dates could create an image in between — and, if convincing, predict the next one: valuable for monitoring sites at risk.
