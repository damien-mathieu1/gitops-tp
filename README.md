# GitOps TP - Application Microservices avec ArgoCD

Ce repository contient une application microservices complète déployée en utilisant les principes GitOps avec ArgoCD.

## Architecture

L'application se compose de 4 services :
- **Frontend** : Application React avec interface utilisateur
- **Backend** : API REST Node.js/Express
- **Database** : PostgreSQL pour la persistence des données
- **Redis** : Cache en mémoire

## Structure du projet

```
.
├── apps/                    # Code source des applications
│   ├── backend/            # Application backend Node.js
│   └── frontend/           # Application frontend React
├── charts/                 # Helm charts
│   ├── frontend/
│   ├── backend/
│   ├── database/
│   └── redis/
├── envs/                   # Configuration par environnement
│   ├── dev/
│   ├── staging/
│   └── production/
└── argocd/                 # Définitions ArgoCD
    ├── applications/       # Applications individuelles
    └── applicationsets/    # ApplicationSets
```

## Prérequis

- Cluster Kubernetes fonctionnel
- kubectl configuré
- helm 3.x installé
- ArgoCD installé sur le cluster
- Un registry Docker (Docker Hub, GHCR, etc.)

## Étapes de déploiement

### 1. Cloner le repository

```bash
git clone https://github.com/YOUR_USERNAME/gitops-argocd-tp.git
cd gitops-argocd-tp
```

### 2. Build et push des images Docker

```bash
# Backend
cd apps/backend
docker build -t your-registry/backend:1.0.0 .
docker push your-registry/backend:1.0.0

# Frontend
cd ../frontend
docker build -t your-registry/frontend:1.0.0 .
docker push your-registry/frontend:1.0.0
```

### 3. Mettre à jour les références d'images

Modifiez les fichiers dans `envs/` pour pointer vers vos images Docker.

### 4. Installer ArgoCD (si non installé)

```bash
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Obtenir le mot de passe admin
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d
```

### 5. Déployer avec ArgoCD

#### Option A : Utiliser les applications individuelles (Dev)

```bash
kubectl apply -f argocd/applications/database-dev.yaml
kubectl apply -f argocd/applications/redis-dev.yaml
kubectl apply -f argocd/applications/backend-dev.yaml
kubectl apply -f argocd/applications/frontend-dev.yaml
```

#### Option B : Utiliser App of Apps

```bash
kubectl apply -f argocd/applications/app-of-apps.yaml
```

#### Option C : Utiliser ApplicationSet (tous les environnements)

```bash
kubectl apply -f argocd/applicationsets/microservices-appset.yaml
```

### 6. Vérifier le déploiement

```bash
# Via kubectl
kubectl get pods -n dev
kubectl get svc -n dev

# Via ArgoCD CLI
argocd app list
argocd app get frontend-dev
```

## Accéder à l'application

### Environnement Dev (sans Ingress)

```bash
# Port-forward frontend
kubectl port-forward -n dev svc/frontend-frontend 8080:80

# Accéder à http://localhost:8080
```

### Environnements Staging/Production (avec Ingress)

Configurez votre DNS pour pointer vers l'IP de votre Ingress Controller.

## Fonctionnalités GitOps

### Sync Waves

Les ressources sont déployées dans l'ordre grâce aux sync waves :
- Wave 0 : Database et Redis
- Wave 1 : Backend
- Wave 2 : Frontend

### Auto-Sync et Self-Heal

Les applications sont configurées pour :
- Se synchroniser automatiquement lors de changements Git
- Se réparer automatiquement si modifiées manuellement

### Health Checks

Tous les services ont des probes configurées :
- Liveness probes
- Readiness probes

## Environnements

### Dev
- 1 replica par service
- Ressources minimales
- Logs en mode debug
- Pas d'ingress
- Volumes : 1Gi

### Staging
- 2 replicas par service
- Ressources moyennes
- Logs en mode info
- Ingress activé
- Volumes : 5Gi

### Production
- 3-5 replicas par service
- Ressources élevées
- Logs en mode warn
- Ingress avec TLS
- HPA activé
- Volumes : 20Gi

## Tests de l'application

L'application propose plusieurs endpoints :

- `GET /health` : Health check
- `GET /api/info` : Informations sur l'API
- `GET /api/visits` : Enregistrer une visite (utilise Redis + PostgreSQL)
- `GET /api/history` : Historique des visites
- `GET /api/db-test` : Tester la connexion PostgreSQL
- `GET /api/redis-test` : Tester la connexion Redis

## Principes GitOps appliqués

1. **Déclaratif** : Tout est défini dans des manifestes YAML
2. **Versionné** : Tout changement passe par Git
3. **Automatique** : ArgoCD synchronise automatiquement
4. **Réconciliation** : Self-healing activé

## Troubleshooting

### Les pods ne démarrent pas

```bash
kubectl describe pod <pod-name> -n dev
kubectl logs <pod-name> -n dev
```

### ArgoCD ne synchronise pas

```bash
argocd app sync <app-name>
argocd app get <app-name>
```

### Problèmes de connexion backend-database

Vérifiez que les noms de services correspondent dans les values files.

## Prochaines étapes

- Implémenter Sealed Secrets pour les secrets
- Ajouter des tests automatisés
- Mettre en place un rollback automatique
- Configurer des notifications
- Ajouter des métriques avec Prometheus

## Auteur

Votre nom - TP GitOps Polytech

## Licence

Ce projet est à des fins éducatives.
