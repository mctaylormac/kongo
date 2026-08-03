# KonGO Professional Design System

## Design Philosophy

KonGO combine l'approche design **Professional Enterprise** avec sa **forte identité de marque** utilisant les couleurs iconiques #101820 et #bfeb30. Cette direction privilégie :

- **Impact Visuel** - Couleurs de marque audacieuses pour une reconnaissance immédiate
- **Crédibilité** - Design mature et sophistiqué malgré des couleurs vives
- **Accessibilité** - Standards WCAG AA+ avec contraste optimisé
- **Cohérence de Marque** - Utilisation systématique des couleurs KonGO originales

## Brand Identity

### Primary Brand Colors (Original KonGO)
```css
--kongo-black: #101820     /* Deep Black - Couleur primaire forte */
--kongo-lime: #bfeb30      /* Bright Lime - Couleur secondaire énergique */
```

### Extended KonGO Color System
```css
/* Black Variations */
--kongo-black: #101820           /* Original brand black */
--kongo-black-hover: #1a2530     /* Hover state */
--kongo-black-light: #2a3441     /* Light variation */
--kongo-black-lighter: #3a4451   /* Lighter variation */
--kongo-black-dark: #0a0f15      /* Darker variation */

/* Lime Variations */
--kongo-lime: #bfeb30            /* Original brand lime */
--kongo-lime-hover: #a8d125      /* Hover state */
--kongo-lime-light: #d4f054      /* Light variation */
--kongo-lime-lighter: #e8f578    /* Lighter variation */
--kongo-lime-dark: #9bc120       /* Dark variation */
--kongo-lime-darker: #7fa118     /* Darker variation */
```

### Professional Neutral Scale (Complementing KonGO Brand)
```css
--gray-50: #f8f9fa     /* Très léger - Backgrounds */
--gray-100: #f1f3f4    /* Léger - Surfaces secondaires */
--gray-200: #e8eaed    /* Bordures principales */
--gray-300: #dadce0    /* Bordures secondaires */
--gray-400: #9aa0a6    /* Texte quaternaire */
--gray-500: #5f6368    /* Texte tertiaire */
--gray-600: #3c4043    /* Texte secondaire foncé */
--gray-700: #202124    /* Texte secondaire */
--gray-800: #171717    /* Texte foncé */
--gray-900: #101820    /* Texte primaire (= kongo-black) */
```

### Semantic Colors (Supporting the Brand)
```css
--color-success: #137333    /* Professional green */
--color-warning: #ea8600    /* Professional orange */
--color-error: #d93025      /* Professional red */
--color-info: #1a73e8       /* Professional blue */
```

## Typography Professional with KonGO Identity

### Font System
- **Font Family**: Inter (Corporate standard, excellent lisibilité)
- **Base Size**: 16px (Accessibility optimized)
- **Scale**: Hiérarchie professionnelle adaptée à l'identité KonGO

### Text Hierarchy
```css
/* Display - Hero sections & annonces majeures */
.text-display-1    /* 56px - Titres héros avec impact KonGO */
.text-display-2    /* 48px - Sous-héros de section */

/* Headings - Hiérarchie de contenu */
.text-h1          /* 36px - Titres de page */
.text-h2          /* 30px - En-têtes de section */
.text-h3          /* 24px - Sous-sections */
.text-h4          /* 20px - Blocs de contenu */
.text-h5          /* 18px - Sections mineures */
.text-h6          /* 16px - Petits en-têtes */

/* Body text - Contenu principal */
.text-body-large  /* 18px - Descriptions importantes */
.text-body        /* 16px - Contenu primaire */
.text-body-small  /* 14px - Contenu secondaire */
.text-body-xs     /* 12px - Métadonnées */

/* Texte fonctionnel */
.text-label       /* 14px - Labels de formulaire */
.text-label-small /* 12px - Petits labels (majuscules) */
.text-meta        /* 14px - Horodatage, métadonnées */
.text-caption     /* 12px - Légendes (majuscules) */
```

### Professional Text Colors with KonGO Brand
```css
.text-primary     /* Contenu principal - #101820 (kongo-black) */
.text-secondary   /* Contenu support - #3c4043 */
.text-tertiary    /* Moins important - #5f6368 */
.text-quaternary  /* Métadonnées - #9aa0a6 */
.text-disabled    /* États désactivés - #dadce0 */
.text-inverse     /* Sur fonds sombres - #ffffff */

/* Couleurs sur marque */
.text-on-black    /* Texte sur fond noir KonGO - #ffffff */
.text-on-lime     /* Texte sur fond lime KonGO - #101820 */
.text-on-lime-dark /* Texte sur lime foncé - #ffffff */

/* Couleurs sémantiques */
.text-success     /* États de succès - #137333 */
.text-warning     /* États d'alerte - #ea8600 */
.text-error       /* États d'erreur - #d93025 */
.text-info        /* États d'information - #1a73e8 */

/* Couleurs de marque */
.text-kongo-black /* Noir KonGO - #101820 */
.text-kongo-lime  /* Lime KonGO - #bfeb30 */
.text-kongo-lime-dark /* Lime foncé - #9bc120 */
```

## Component Guidelines

### KonGO Professional Buttons
```css
.btn-primary        /* Actions principales - Fond noir KonGO */
.btn-secondary      /* Actions secondaires - Fond lime KonGO */
.btn-accent         /* Actions d'alerte - Orange professionnel */
.btn-outline        /* Contour noir KonGO */
.btn-outline-lime   /* Contour lime KonGO */
.btn-ghost          /* Actions subtiles */
```

**Implementation:**
```jsx
<Button className="btn-primary">Action Principale</Button>
<Button className="btn-secondary">Action Lime</Button>
<Button className="btn-outline">Contour Noir</Button>
<Button className="btn-outline-lime">Contour Lime</Button>
<Button className="btn-ghost">Action Subtile</Button>
```

### Professional Cards avec Identité KonGO
```css
.card-elevated    /* Card standard surélevée */
.card-interactive /* Card cliquable/survolable */
.card-kongo       /* Card avec dégradé de marque KonGO */
```

**Usage:**
```jsx
<div className="card-elevated p-6">
  <h3 className="text-h4 text-primary">Section Standard</h3>
  <p className="text-body text-secondary">Contenu descriptif</p>
</div>

<div className="card-kongo p-6">
  <h3 className="text-h4 text-on-black">Section KonGO</h3>
  <p className="text-body-large text-on-black opacity-90">Contenu premium</p>
</div>
```

### Status Indicators avec KonGO
```css
.status-success   /* Badges/indicateurs de succès */
.status-warning   /* Badges/indicateurs d'alerte */
.status-error     /* Badges/indicateurs d'erreur */
.status-info      /* Badges/indicateurs d'info */
.status-kongo     /* Badges/indicateurs de marque KonGO */
```

### Surface System avec KonGO
```css
.bg-surface-primary              /* Fonds principaux - #ffffff */
.bg-surface-secondary            /* Fonds de section - #f8f9fa */
.bg-surface-tertiary             /* Fonds de carte - #f1f3f4 */
.bg-surface-elevated             /* Composants surélevés - #ffffff */

/* Surfaces de marque KonGO */
.bg-surface-kongo-lime-light     /* Fond lime très léger */
.bg-surface-kongo-lime-medium    /* Fond lime moyen */
.bg-kongo-black                  /* Fond noir KonGO */
.bg-kongo-lime                   /* Fond lime KonGO */
```

## Professional Spacing System

### Spacing Scale
```css
--space-1: 4px     /* Micro espacement */
--space-2: 8px     /* Petit espacement */
--space-3: 12px    /* Espacement de base */
--space-4: 16px    /* Espacement moyen */
--space-5: 20px    /* Grand espacement */
--space-6: 24px    /* XL espacement */
--space-8: 32px    /* XXL espacement */
--space-10: 40px   /* Espacement de section */
--space-12: 48px   /* Grand espacement de section */
--space-16: 64px   /* Espacement de section majeure */
--space-20: 80px   /* Espacement héros */
--space-24: 96px   /* Espacement maximum */
```

### Content Spacing
```css
.space-y-professional  /* Rythme vertical standard (24px) */
.space-y-tight        /* Rythme vertical serré (16px) */
.space-y-loose        /* Rythme vertical large (32px) */
```

## Shadow System avec KonGO

```css
/* Ombres standard */
--shadow-sm: 0 1px 2px rgba(16, 24, 32, 0.05)
--shadow-base: 0 1px 3px rgba(16, 24, 32, 0.1), 0 1px 2px rgba(16, 24, 32, 0.1)
--shadow-md: 0 4px 6px rgba(16, 24, 32, 0.1), 0 2px 4px rgba(16, 24, 32, 0.1)
--shadow-lg: 0 10px 15px rgba(16, 24, 32, 0.1), 0 4px 6px rgba(16, 24, 32, 0.1)
--shadow-xl: 0 20px 25px rgba(16, 24, 32, 0.1), 0 8px 10px rgba(16, 24, 32, 0.1)
--shadow-2xl: 0 25px 50px rgba(16, 24, 32, 0.25)

/* Ombres de marque KonGO */
--shadow-kongo-lime: 0 4px 14px rgba(191, 235, 48, 0.39)
--shadow-kongo-black: 0 8px 25px rgba(16, 24, 32, 0.3)
```

## KonGO Brand Gradients

```css
.gradient-kongo         /* Dégradé noir vers lime KonGO */
.gradient-kongo-reverse /* Dégradé lime vers noir KonGO */
.gradient-kongo-subtle  /* Dégradé subtil avec touche lime */
```

## Layout Guidelines

### Container System
```css
.container-professional  /* Max-width: 1280px, padding responsive */
```

### Grid Patterns avec Identité KonGO
- **Hero sections**: Mise en page 2 colonnes avec éléments de marque
- **Sections de contenu**: Grilles responsive 1-3 colonnes
- **Cards**: Padding cohérent 24px, border-radius 12px
- **Formulaires**: Espacement 12px entre champs, 24px entre sections
- **Éléments de marque**: Utilisation stratégique des couleurs KonGO

## Accessibility Standards avec KonGO

### Contrast Requirements
- **Texte normal**: 4.5:1 minimum (WCAG AA)
- **Texte large**: 3:1 minimum  
- **Composants UI**: 3:1 minimum
- **Éléments de marque**: Testés contre tous les fonds
- **Lime KonGO**: Utilisé avec précaution pour maintenir les contrastes

### Focus Management
- **Indicateurs de focus**: Contour lime KonGO 2px, décalage 2px
- **Éléments interactifs**: Cibles tactiles minimum 44px
- **Navigation clavier**: Ordre de tabulation logique maintenu

### Motion Preferences
- **Mouvement réduit**: Respecté via `prefers-reduced-motion`
- **Durée d'animation**: 150-300ms pour interface, 600-800ms pour contenu
- **Easing**: `ease-in-out` pour interface, `ease-out` pour entrées

## Implementation Examples

### KonGO Professional Header
```jsx
<header className="bg-surface-elevated border-b border-border-primary shadow-base">
  <div className="container-professional py-4">
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-kongo-black rounded-lg flex items-center justify-center">
          <span className="text-on-black font-bold text-lg">K</span>
        </div>
        <div>
          <div className="text-h4 text-kongo-black font-bold">KonGO</div>
          <div className="text-caption text-tertiary">Transport RDC</div>
        </div>
      </div>
      <Button className="btn-secondary">
        <span className="text-kongo-black font-semibold">Réserver</span>
      </Button>
    </div>
  </div>
</header>
```

### KonGO Professional Card
```jsx
<div className="card-interactive bg-surface-elevated p-6 hover:border-kongo-lime">
  <div className="flex items-center justify-between mb-4">
    <h3 className="text-h4 text-kongo-black">Kinshasa → Lubumbashi</h3>
    <Badge className="status-success">Disponible</Badge>
  </div>
  <div className="space-y-3">
    <div className="flex items-center justify-between">
      <span className="text-label text-secondary">Durée</span>
      <span className="text-body text-primary font-medium">16h</span>
    </div>
    <div className="flex items-center justify-between">
      <span className="text-label text-secondary">Prix</span>
      <span className="text-h5 text-kongo-black font-bold">125,000 CDF</span>
    </div>
  </div>
  <Button className="btn-primary w-full mt-6">Sélectionner</Button>
</div>
```

### KonGO Brand Hero
```jsx
<section className="bg-gradient-kongo-subtle py-24">
  <div className="container-professional">
    <div className="text-center space-y-8">
      <div className="inline-flex items-center space-x-2 bg-surface-kongo-lime-light px-4 py-2 rounded-full">
        <div className="w-2 h-2 bg-kongo-lime rounded-full"></div>
        <span className="text-caption text-kongo-lime-dark font-semibold">
          Nouveau : Programme Fidélité KonGO
        </span>
      </div>
      
      <h1 className="text-display-1 text-kongo-black">
        Voyagez à travers le{" "}
        <span className="text-kongo-lime">Congo</span>{" "}
        en toute sérénité
      </h1>
      
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button className="btn-primary px-8 py-4">
          Réserver Maintenant
        </Button>
        <Button className="btn-outline-lime px-8 py-4">
          En Savoir Plus
        </Button>
      </div>
    </div>
  </div>
</section>
```

### KonGO Professional Form
```jsx
<form className="space-y-6 bg-surface-elevated p-8 rounded-lg border border-border-primary">
  <div className="space-y-2">
    <label className="text-label text-primary font-medium">
      Ville de départ
    </label>
    <Select>
      <SelectTrigger className="h-12 border-border-secondary focus:border-kongo-lime focus:ring-kongo-lime">
        <SelectValue placeholder="Sélectionnez votre départ" />
      </SelectTrigger>
    </Select>
  </div>
  
  <Button className="btn-primary w-full h-12">
    <Search className="w-5 h-5 mr-2" />
    Rechercher des Trajets
  </Button>
  
  <div className="bg-surface-kongo-lime-light p-4 rounded-lg border border-kongo-lime/20">
    <p className="text-body-small text-kongo-lime-dark">
      <strong>Astuce :</strong> Réservez à l'avance pour obtenir les meilleurs tarifs !
    </p>
  </div>
</form>
```

## Best Practices KonGO

### Brand Color Usage
1. **Noir KonGO (#101820)** - Actions principales, texte primaire, éléments de confiance
2. **Lime KonGO (#bfeb30)** - Accents, CTA secondaires, éléments d'attention, highlights
3. **Variations** - Utiliser les nuances pour créer de la profondeur
4. **Contraste** - Toujours vérifier la lisibilité, surtout avec le lime

### Content Organization
1. **Hiérarchie claire** - Utiliser couleurs de marque pour renforcer l'importance  
2. **Scanning** - Lime KonGO pour guider l'œil vers les éléments clés
3. **Grouping** - Noir KonGO pour structurer et délimiter
4. **Brand moments** - Intégrer les couleurs de manière stratégique

### Animation Guidelines
1. **Énergique mais professionnelle** - Refléter la personnalité KonGO
2. **Sublimes transitions** - Avec effets lime pour moments clés
3. **Performance** - Optimisé pour tous appareils
4. **Accessible** - Respecter préférences utilisateur

### Component Composition
1. **Atomic design** - Composants réutilisables avec variantes KonGO
2. **Brand consistency** - Application cohérente des couleurs 
3. **Responsive** - Approche mobile-first avec identité préservée
4. **Accessible** - ARIA et sémantique HTML maintenue

## Testing Checklist KonGO

- [ ] **Contraste KonGO** - Noir et lime respectent WCAG AA
- [ ] **Navigation** - Focus lime visible et utilisable
- [ ] **Responsive** - Identité de marque préservée sur tous écrans
- [ ] **Performance** - Couleurs optimisées, pas de ralentissement
- [ ] **Browser** - Rendu cohérent des couleurs KonGO
- [ ] **Mobile** - Couleurs vives optimisées pour petits écrans
- [ ] **Accessibility** - Couleurs utilisables par tous
- [ ] **Brand recognition** - Couleurs reconnaissables instantanément

## Color Psychology & Brand Impact

### Noir KonGO (#101820)
- **Connotations**: Sophistication, fiabilité, autorité
- **Usage**: Texte principal, éléments de confiance, actions importantes
- **Impact**: Inspire confiance et professionnalisme

### Lime KonGO (#bfeb30) 
- **Connotations**: Énergie, fraîcheur, innovation, croissance
- **Usage**: Accents, CTA, éléments d'attention, highlights
- **Impact**: Dynamise l'interface, attire l'attention, mémorable

### Combinaison Noir + Lime
- **Synergie**: Équilibre entre professionnalisme et énergie
- **Différenciation**: Palette unique dans le secteur transport
- **Mémorabilité**: Forte reconnaissance de marque
- **Emotion**: Confiance énergique, fiabilité dynamique

Cette direction allie l'impact visuel des couleurs KonGO originales à une approche design professionnelle, créant une identité unique et mémorable dans le secteur du transport congolais.