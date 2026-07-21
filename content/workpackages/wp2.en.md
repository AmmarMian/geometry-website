---
title: "New geometric machine learning models"
layout: wp
nav: wp
weight: 2
num: "WP 2"
members: "F. Chatelain · G. Ginolhac · N. Le Bihan · A. Mian"
card: "Extending SPDNet to transformer architectures for the temporal dimension, and to federated learning for multimodal data."
---

## Motivation

SPDNet made it possible to build neural networks directly on covariance matrices, and has proven remarkably robust on small, highly variable datasets. But its architecture predates the transformer era: it handles neither the temporal dimension nor the multimodality of modern remote-sensing data. This WP develops two successors.

## Transformer SPDNet

A transformer whose every ingredient is rebuilt for sequences of SPD matrices: positional encoding inspired by the Siegel group; attention scores based on the Riemannian metric and Riemannian angles (or Fisher vectors) rather than log-Euclidean distances; output sequences computed with better-behaved centers such as the symmetrized Kullback–Leibler barycenter; normalizations based on determinant or trace. Random matrix theory will help tame high-dimensional covariance matrices.

<span style="color:var(--muted)">Evaluation: semantic classification on temporal remote-sensing datasets, and change detection on UAVSAR.</span>

## Federated SPDNet

Rather than fusing all modalities on one server, models are trained on separate clients that only exchange coefficients — a natural fit for lightweight geometric models. The key ingredient is computing barycenters of SPDNet coefficients on the Stiefel manifold, directly and cheaply, on the central server. A second line extends the pipeline to heterogeneous modalities — covariance matrices of different sizes and meanings (spectro-angular in SAR, spectral in multi/hyperspectral) — via compact smooth manifolds and data imputation.

<span style="color:var(--muted)">Evaluation: real multimodal remote-sensing datasets.</span>
