/**
 * @file swagger.ts
 * @description Specification OpenAPI 3.0 et configuration de Swagger UI pour l'API Infirmerie BCRG.
 * Fournit une interface interactive permettant de tester les endpoints et de partager
 * le contrat d'API avec les equipes frontend et partenaires.
 */

import { Application, Request, Response } from 'express';
import swaggerUi from 'swagger-ui-express';

/**
 * Document de specification OpenAPI 3.0 complet pour les endpoints du backend.
 */
export const swaggerDocument = {
  openapi: '3.0.3',
  info: {
    title: 'API Infirmerie BCRG',
    version: '1.0.0',
    description:
      'Documentation officielle et interactive de l\'API REST du systeme de gestion de l\'infirmerie de la Banque Centrale de la Republique de Guinee (BCRG).\n\nCette API prend en charge la gestion des utilisateurs, l\'authentification securisee par matricule, les profils collaborateurs, les consultations cliniques, les constantes vitales et la tracabilite des acces.\n\n---\n\n**Ressources et Exports Disponibles :**\n- [Telecharger le schema OpenAPI au format JSON](/api/docs/download)\n- [Consulter la vue Redoc autonome (HTML)](/api/docs/redoc)',
    contact: {
      name: 'Direction des Systemes d\'Information | Mamadou BANO Barry - BCRG',
      email: 'mamadoub.barry@bcrg-guinee.org',
    },
  },
  servers: [
    {
      url: '/',
      description: 'Serveur courant (auto-detecte par le navigateur)',
    },
    {
      url: 'https://backend-med-bcrg.onrender.com',
      description: 'Serveur de production / recette en ligne (Render)',
    },
    {
      url: 'http://localhost:5000',
      description: 'Serveur de developpement local (Localhost)',
    },
  ],
  tags: [
    {
      name: 'Authentification',
      description: 'Gestion des sessions, connexion par matricule et mot de passe initial.',
    },
    {
      name: 'Employes',
      description: 'Gestion des employes (enrolement, fiches d\'identification, coordonnees et profil d\'allergies).',
    },
    {
      name: 'Medecin - Consultations',
      description: 'Espace clinique dedie au medecin (demarrage de consultation, constantes vitales, ordonnances et KPIs).',
    },
    {
      name: 'Medecin - Dossiers & Recherche',
      description: 'Recherche rapide de patients et consultation du dossier medical complet par le personnel soignant.',
    },
    {
      name: 'Ressources Humaines & Reporting',
      description: 'Pilotage RH, indicateurs agreges, activite diabetique et export officiel de rapport PDF.',
    },
    {
      name: 'Espace Collaborateur - Patient',
      description: 'Espace sante du collaborateur : historique des constantes vitales, consultation et televersement securise de documents (analyses, imagerie, ordonnances).',
    },
    {
      name: 'Medecin - Agenda & Rendez-vous',
      description: 'Agenda medical, calendrier hebdomadaire et mensuel, approbation, reprogrammation et demarrage de consultation.',
    },
    {
      name: 'Ressources Humaines - Periodicite des Visites',
      description: 'Politique de medecine du travail, periodicite des visites obligatoires (Standard, SMR) et relances automatiques.',
    },
  ],
  paths: {
    '/api/auth/login': {
      post: {
        tags: ['Authentification'],
        summary: 'Connexion d\'un collaborateur',
        description:
          'Authentifie un utilisateur via son matricule unique BCRG et son mot de passe. Retourne un access token JWT valide 15 minutes ainsi qu\'un refresh token place dans un cookie securise httpOnly.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/LoginInput',
              },
              example: {
                matricule: '2004',
                password: 'ChangeMe@2026!',
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Connexion reussie.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/AuthSuccessResponse',
                },
              },
            },
          },
          400: {
            description: 'Donnees de requete invalides (matricule vide ou format incorrect).',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
          401: {
            description: 'Identifiants de connexion incorrects.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
          403: {
            description: 'Compte utilisateur desactive.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
        },
      },
    },
    '/api/auth/change-initial-password': {
      post: {
        tags: ['Authentification'],
        summary: 'Changement obligatoire du mot de passe initial',
        description:
          'Permet a un utilisateur dont le champ is_first_login est a true de definir son mot de passe personnel securise. L\'access token doit etre fourni dans l\'en-tete Authorization: Bearer <token>.',
        security: [
          {
            bearerAuth: [],
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ChangeInitialPasswordInput',
              },
              example: {
                currentPassword: 'ChangeMe@2026!',
                newPassword: 'BcrgSecure#2026',
                confirmPassword: 'BcrgSecure#2026',
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Mot de passe mis a jour avec succes.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/AuthSuccessResponse',
                },
              },
            },
          },
          400: {
            description: 'Nouveau mot de passe non conforme aux regles de complexite ou mot de passe actuel invalide.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
          401: {
            description: 'Jeton JWT absent, expire ou invalide.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
        },
      },
    },
    '/api/auth/me': {
      get: {
        tags: ['Authentification'],
        summary: 'Profil de l\'utilisateur connecte',
        description:
          'Retourne les donnees de profil de l\'utilisateur associe au jeton JWT courant, incluant son role et ses informations le cas echeant.',
        security: [
          {
            bearerAuth: [],
          },
        ],
        responses: {
          200: {
            description: 'Profil recupere avec succes.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/UserProfileResponse',
                },
              },
            },
          },
          401: {
            description: 'Jeton JWT manquant ou non valide.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
        },
      },
    },
    '/api/auth/refresh-token': {
      post: {
        tags: ['Authentification'],
        summary: 'Renouvellement de la paire de jetons',
        description:
          'Genere un nouvel access token a partir du refresh token stocke dans le cookie securise ou passe dans le corps de la requete.',
        requestBody: {
          required: false,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  refreshToken: {
                    type: 'string',
                    description: 'Jeton de rafraichissement optionnel si deja present en cookie httpOnly.',
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Jetons renouveles avec succes.',
            content: {
              'application/json': {
                example: {
                  success: true,
                  message: 'Session renouvelee avec succes.',
                  data: {
                    accessToken: 'eyJhbGciOiJIUzI1NiIsIn...',
                    refreshToken: 'eyJhbGciOiJIUzI1NiIsIn...',
                  },
                },
              },
            },
          },
          401: {
            description: 'Refresh token invalide ou expire.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
        },
      },
    },
    '/api/auth/logout': {
      post: {
        tags: ['Authentification'],
        summary: 'Deconnexion de l\'utilisateur',
        description: 'Supprime le cookie httpOnly contenant le refresh token.',
        responses: {
          200: {
            description: 'Deconnexion reussie.',
            content: {
              'application/json': {
                example: {
                  success: true,
                  message: 'Deconnexion reussie.',
                },
              },
            },
          },
        },
      },
    },
    '/api/employees': {
      post: {
        tags: ['Employes'],
        summary: 'Enrolement d\'un nouvel employe',
        description:
          'Enrole un collaborateur comme employe et initialise sa fiche. Reserve exclusivement aux administrateurs RH (HR).',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateEmployeeInput' },
              example: {
                matricule: '2004',
                firstName: 'Mamadou BANO',
                lastName: 'BARRY',
                email: 'mamadoub.barry@bcrg-guinee.org',
                phone: '+224627000000',
                gender: 'M',
                department: 'Direction des Systèmes d\'Information',
                jobTitle: 'Ingénieur Logiciel DSI',
                bloodGroup: 'O+',
                medicalHistory: 'Asthme modere dans l\'enfance, aucun antecedent chirurgical.',
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Employe enrole avec succes.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/EmployeeDetailResponse' },
              },
            },
          },
          400: {
            description: 'Donnees de requete invalides ou manquantes.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          401: {
            description: 'Non authentifie : jeton absent ou expire.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          403: {
            description: 'Droits insuffisants (reserve aux administrateurs RH) ou mot de passe initial non modifie.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          409: {
            description: 'Conflit : matricule, email ou numero de telephone deja associe a un compte existant.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
      get: {
        tags: ['Employes'],
        summary: 'Liste paginee des employes',
        description:
          'Permet aux administrateurs RH de rechercher et lister les employes par matricule, nom, prenom ou direction d\'affectation.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'search',
            in: 'query',
            description: 'Recherche par nom, prenom ou matricule',
            schema: { type: 'string' },
          },
          {
            name: 'department',
            in: 'query',
            description: 'Filtre par direction ou service',
            schema: { type: 'string' },
          },
          {
            name: 'page',
            in: 'query',
            description: 'Numero de page (defaut: 1)',
            schema: { type: 'integer', default: 1 },
          },
          {
            name: 'limit',
            in: 'query',
            description: 'Nombre de resultats par page (defaut: 10)',
            schema: { type: 'integer', default: 10 },
          },
        ],
        responses: {
          200: {
            description: 'Liste des employes recuperee avec succes.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/EmployeeListResponse' },
              },
            },
          },
          401: {
            description: 'Non authentifie : jeton absent ou expire.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          403: {
            description: 'Droits insuffisants : acces reserve exclusivement aux administrateurs RH.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/api/employees/me': {
      get: {
        tags: ['Employes'],
        summary: 'Fiche de l\'employe connecte',
        description:
          'Permet au collaborateur authentifie de consulter sa propre fiche employe et ses allergies en toute confidentialite.',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Fiche de l\'employe connecte recuperee avec succes.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/EmployeeDetailResponse' },
              },
            },
          },
          401: {
            description: 'Non authentifie : jeton absent ou expire.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          404: {
            description: 'Aucune fiche employe associee a ce compte.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/api/employees/{id}': {
      get: {
        tags: ['Employes'],
        summary: 'Consultation d\'un employe par identifiant',
        description:
          'Accessible aux administrateurs RH (HR), soignants (DOCTOR) ou a l\'employe concerne par sa propre fiche (protection anti-BOLA).',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Identifiant unique de l\'employe (UUID)',
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          200: {
            description: 'Fiche employe trouvee.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/EmployeeDetailResponse' },
              },
            },
          },
          401: {
            description: 'Non authentifie : jeton absent ou expire.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          403: {
            description: 'Acces refuse : secret medical / BOLA.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          404: {
            description: 'Employe introuvable.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
      put: {
        tags: ['Employes'],
        summary: 'Mise a jour des informations d\'un employe',
        description:
          'Permet aux administrateurs RH de modifier la direction, le poste, le numero de telephone, le groupe sanguin ou les coordonnees.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Identifiant unique de l\'employe (UUID)',
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateEmployeeInput' },
              example: {
                phone: '+224627000000',
                department: 'Direction des Systèmes d\'Information',
                jobTitle: 'Ingénieur Logiciel DSI',
                bloodGroup: 'O+',
                medicalHistory: 'Asthme modere dans l\'enfance, aucun antecedent chirurgical.',
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Informations de l\'employe mises a jour avec succes.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/EmployeeDetailResponse' },
              },
            },
          },
          400: {
            description: 'Donnees de mise a jour invalides.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          401: {
            description: 'Non authentifie : jeton absent ou expire.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          403: {
            description: 'Droits insuffisants : acces reserve exclusivement aux administrateurs RH.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          404: {
            description: 'Employe introuvable.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          409: {
            description: 'Conflit : ce numero de telephone est deja utilise par un autre employe ou compte.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/api/employees/{id}/allergies': {
      post: {
        tags: ['Employes'],
        summary: 'Ajout d\'une allergie a l\'employe',
        description:
          'Enregistre une allergie classee (medicamenteuse, alimentaire, professionnelle) avec niveau de severite (MILD, MODERATE, SEVERE). Reserve au personnel soignant.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Identifiant unique de l\'employe (UUID)',
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AddEmployeeAllergyInput' },
              example: {
                allergyType: 'DRUG',
                substance: 'Penicilline',
                reactionDetails: 'Urticaire generalisee et oedeme de Quincke',
                severity: 'SEVERE',
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Allergie enregistree avec succes.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AllergyDetailResponse' },
              },
            },
          },
          400: {
            description: 'Donnees d\'allergie invalides.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          401: {
            description: 'Non authentifie : jeton absent ou expire.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          403: {
            description: 'Droits soignants requis.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          404: {
            description: 'Employe introuvable.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/api/employees/{id}/allergies/{allergyId}': {
      delete: {
        tags: ['Employes'],
        summary: 'Suppression d\'une allergie de l\'employe',
        description: 'Retire une allergie de la fiche employe. Reserve au personnel soignant.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Identifiant de l\'employe (UUID)',
            schema: { type: 'string', format: 'uuid' },
          },
          {
            name: 'allergyId',
            in: 'path',
            required: true,
            description: 'Identifiant de l\'allergie a retirer (UUID)',
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          200: {
            description: 'Allergie retiree avec succes.',
            content: {
              'application/json': {
                example: {
                  success: true,
                  message: 'Allergie retiree de la fiche employe avec succes.',
                },
              },
            },
          },
          401: {
            description: 'Non authentifie : jeton absent ou expire.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          403: {
            description: 'Droits soignants requis.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          404: {
            description: 'Allergie introuvable.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/api/doctor/dashboard': {
      get: {
        tags: ['Medecin - Consultations'],
        summary: 'Vue d\'ensemble complete du tableau de bord medecin',
        description:
          'Fournit l\'integralite des indicateurs du dashboard : 5 KPIs superieurs (consultations du jour, actives, departements, personnel examine, utilisateurs), historique hebdomadaire sur 7 jours (LUN-DIM), alertes et taches prioritaires, top 5 des consultations recentes et raccourcis d\'acces rapide.',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Donnees completes du dashboard recuperees avec succes.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/DoctorDashboardResponse' },
              },
            },
          },
          401: {
            description: 'Non authentifie.',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
            },
          },
          403: {
            description: 'Acces reserve au personnel soignant (DOCTOR).',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
            },
          },
        },
      },
    },
    '/api/doctor/consultations/stats': {
      get: {
        tags: ['Medecin - Consultations'],
        summary: 'Statistiques cles du dashboard medecin',
        description: 'Retourne les indicateurs temps reel (consultations du mois, urgences recentes, en attente/en cours aujourd\'hui).',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Statistiques recuperees avec succes.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ConsultationStatsResponse' },
              },
            },
          },
          401: {
            description: 'Non authentifie.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          403: {
            description: 'Acces reserve au role DOCTOR.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/api/doctor/consultations': {
      get: {
        tags: ['Medecin - Consultations'],
        summary: 'Liste filtree et paginee des consultations',
        description: 'Permet au medecin de rechercher et filtrer les consultations par patient, matricule, diagnostic, date, type et statut.',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'search', in: 'query', description: 'Recherche patient, matricule, diagnostic', schema: { type: 'string' } },
          { name: 'type', in: 'query', description: 'Type de consultation', schema: { type: 'string', enum: ['GENERAL', 'INSTANT', 'PERIODIC'] } },
          { name: 'status', in: 'query', description: 'Statut de la consultation', schema: { type: 'string', enum: ['WAITING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] } },
          { name: 'date', in: 'query', description: 'Date de consultation (YYYY-MM-DD)', schema: { type: 'string' } },
          { name: 'page', in: 'query', description: 'Numero de page', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', description: 'Resultats par page', schema: { type: 'integer', default: 10 } },
        ],
        responses: {
          200: {
            description: 'Liste des consultations recuperee avec succes.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ConsultationListResponse' },
              },
            },
          },
          401: { description: 'Non authentifie.', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          403: { description: 'Acces reserve au personnel soignant (DOCTOR).', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
      post: {
        tags: ['Medecin - Consultations'],
        summary: 'Demarrer une nouvelle consultation',
        description: 'Cree une nouvelle consultation clinique avec constantes vitales optionnelles (calcul automatique IMC).',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateConsultationInput' },
              example: {
                patientId: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
                type: 'GENERAL',
                reason: 'Suivi diabétique et maux de tête',
                diagnosis: 'Diabète de type 2 équilibré',
                advice: 'Régime pauvre en sucres rapides, bonne hydratation',
                vitals: {
                  bloodPressure: '130/85',
                  temperatureC: 37.2,
                  heightCm: 178,
                  weightKg: 75,
                },
                glycemia: {
                  performed: true,
                  value: 1.18,
                  unit: 'g/L',
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Consultation demarree avec succes.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ConsultationDetailResponse' },
              },
            },
          },
          400: { description: 'Donnees invalides.', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          401: { description: 'Non authentifie.', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          403: { description: 'Reserve au personnel soignant.', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/api/doctor/consultations/{id}': {
      get: {
        tags: ['Medecin - Consultations'],
        summary: 'Detail d\'une consultation (tiroir clinique)',
        description: 'Recupere l\'integralite des informations de la consultation : patient, constantes, controle glycemique, ordonnances et diagnostic.',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, description: 'Identifiant UUID de la consultation', schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          200: {
            description: 'Detail de la consultation recupere avec succes.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ConsultationDetailResponse' },
              },
            },
          },
          404: { description: 'Consultation introuvable.', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
      patch: {
        tags: ['Medecin - Consultations'],
        summary: 'Mettre a jour ou cloturer une consultation',
        description: 'Permet de mettre a jour le diagnostic, les notes, la glycemie ou de passer le statut a COMPLETED (TERMINEE).',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, description: 'Identifiant UUID de la consultation', schema: { type: 'string', format: 'uuid' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateConsultationInput' },
              example: {
                status: 'COMPLETED',
                diagnosis: 'Diabète de type 2 stable',
                advice: 'Poursuite du traitement, contrôle dans 1 mois',
                glycemia: {
                  performed: true,
                  value: 1.20,
                  unit: 'g/L',
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Consultation mise a jour avec succes.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ConsultationDetailResponse' },
              },
            },
          },
          404: { description: 'Consultation introuvable.', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/api/doctor/consultations/{id}/prescriptions': {
      post: {
        tags: ['Medecin - Consultations'],
        summary: 'Ajouter une prescription a l\'ordonnance',
        description: 'Enregistre une ligne de prescription (medicament, posologie, duree).',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, description: 'Identifiant UUID de la consultation', schema: { type: 'string', format: 'uuid' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AddPrescriptionInput' },
              example: {
                medicationName: 'Paracétamol 1000mg',
                dosage: '1 comprimé',
                frequency: '3 fois par jour',
                duration: '5 jours',
                instructions: 'Au cours des repas',
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Prescription ajoutee avec succes.',
            content: {
              'application/json': {
                example: {
                  success: true,
                  message: 'Prescription ajoutée à l\'ordonnance.',
                  data: {
                    id: 'f1e2d3c4-b5a6-7890-abcd-ef1234567890',
                    medicationName: 'Paracétamol 1000mg',
                    dosage: '1 comprimé',
                    duration: '5 jours',
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/doctor/consultations/{id}/prescriptions/{prescriptionId}': {
      delete: {
        tags: ['Medecin - Consultations'],
        summary: 'Retirer une prescription de l\'ordonnance',
        description: 'Supprime une ligne de prescription rattachee a la consultation.',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, description: 'Identifiant consultation', schema: { type: 'string', format: 'uuid' } },
          { name: 'prescriptionId', in: 'path', required: true, description: 'Identifiant prescription', schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          200: {
            description: 'Prescription retiree.',
            content: {
              'application/json': {
                example: { success: true, message: 'Prescription retiree de l\'ordonnance avec succes.' },
              },
            },
          },
        },
      },
    },
    '/api/doctor/consultations/{id}/prescription/generate': {
      post: {
        tags: ['Medecin - Consultations'],
        summary: 'Generer automatiquement l\'ordonnance officielle en PDF',
        description:
          'Genere un document PDF d\'ordonnance medicale conforme a la charte officielle BCRG a partir des prescriptions et du diagnostic de la consultation. Le document est stocke et rattache au dossier medical du patient.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Identifiant UUID de la consultation',
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          201: {
            description: 'Ordonnance generee et enregistree avec succes.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/MedicalDocumentSingleResponse' },
              },
            },
          },
          400: {
            description: 'Aucune prescription a inclure dans l\'ordonnance.',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
            },
          },
          404: {
            description: 'Consultation introuvable.',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
            },
          },
        },
      },
    },
    '/api/doctor/patients/search': {
      get: {
        tags: ['Medecin - Dossiers & Recherche'],
        summary: 'Autocompletion de recherche de patient',
        description: 'Recherche rapide par nom, prenom ou matricule pour le formulaire de consultation.',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'q', in: 'query', required: true, description: 'Terme de recherche (nom ou matricule)', schema: { type: 'string' } },
          { name: 'limit', in: 'query', description: 'Nombre max de resultats (defaut: 10)', schema: { type: 'integer', default: 10 } },
        ],
        responses: {
          200: {
            description: 'Resultats de la recherche.',
            content: {
              'application/json': {
                example: {
                  success: true,
                  data: [
                    {
                      id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
                      registrationNumber: 'MAT-2026-001',
                      matricule: '2026-001',
                      fullName: 'Mamadou Diallo',
                      department: 'Direction Informatique',
                      jobTitle: 'Développeur',
                    },
                  ],
                },
              },
            },
          },
        },
      },
    },
    '/api/doctor/patients/{id}/medical-record': {
      get: {
        tags: ['Medecin - Dossiers & Recherche'],
        summary: 'Dossier medical complet du patient pour le medecin',
        description: 'Retourne l\'integralite du dossier medical : constantes, antecedents, allergies classees et historique des consultations.',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, description: 'Identifiant UUID du patient', schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          200: {
            description: 'Dossier medical recupere avec succes.',
            content: {
              'application/json': {
                example: {
                  success: true,
                  data: {
                    id: 'uuid',
                    registrationNumber: '2004',
                    gender: 'M',
                    department: 'Direction des Systèmes d\'Information',
                    jobTitle: 'Ingénieur Logiciel DSI',
                    bloodGroup: 'O+',
                    medicalHistory: 'Asthme modere dans l\'enfance',
                    createdAt: '2026-09-30T09:00:00.000Z',
                    user: {
                      id: 'uuid',
                      matricule: '2004',
                      firstName: 'Mamadou BANO',
                      lastName: 'BARRY',
                      email: 'mamadoub.barry@bcrg-guinee.org',
                      phone: '+224627000000',
                      department: 'Direction des Systèmes d\'Information',
                      jobTitle: 'Ingénieur Logiciel DSI',
                      role: 'EMPLOYEE',
                    },
                    allergies: [],
                    consultations: [],
                    vitalSignsHistory: [],
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/doctor/patients/{id}/documents': {
      get: {
        tags: ['Medecin - Dossiers & Recherche'],
        summary: 'Liste des documents medicaux du patient',
        description: 'Recupere tous les documents generes (ordonnances, fiches de liaison...) du patient avec liens directs de visualisation et telechargement.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Identifiant UUID du patient',
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          200: {
            description: 'Liste des documents du patient recuperee avec succes.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/MedicalDocumentListResponse' },
              },
            },
          },
          404: {
            description: 'Patient introuvable.',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
            },
          },
        },
      },
    },
    '/api/doctor/documents/{documentId}/view': {
      get: {
        tags: ['Medecin - Dossiers & Recherche'],
        summary: 'Visualiser un document medical (PDF en ligne)',
        description: 'Affiche directement le document PDF dans le navigateur ou dans le tiroir patient (Content-Disposition: inline).',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'documentId',
            in: 'path',
            required: true,
            description: 'Identifiant UUID du document medical',
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          200: {
            description: 'Flux binaire du fichier PDF.',
            content: {
              'application/pdf': {
                schema: {
                  type: 'string',
                  format: 'binary',
                },
              },
            },
          },
          404: {
            description: 'Document introuvable sur le disque ou en base de donnees.',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
            },
          },
        },
      },
    },
    '/api/doctor/documents/{documentId}/download': {
      get: {
        tags: ['Medecin - Dossiers & Recherche'],
        summary: 'Telecharger un document medical (PDF en piece jointe)',
        description: 'Declenche le telechargement securise du document PDF (Content-Disposition: attachment).',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'documentId',
            in: 'path',
            required: true,
            description: 'Identifiant UUID du document medical',
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          200: {
            description: 'Fichier PDF en telechargement binaire.',
            content: {
              'application/pdf': {
                schema: {
                  type: 'string',
                  format: 'binary',
                },
              },
            },
          },
          404: {
            description: 'Document introuvable sur le disque ou en base de donnees.',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
            },
          },
        },
      },
    },
    '/api/hr/dashboard': {
      get: {
        tags: ['Ressources Humaines & Reporting'],
        summary: 'Tableau de bord RH et synthese d\'activite',
        description: 'Fournit aux responsables RH les indicateurs globaux du personnel et de l\'infirmerie (effectifs actifs, volume de consultations ce mois, journees d\'arret de travail). Reserve au role HR.',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Donnees de synthese RH recuperees avec succes.',
            content: {
              'application/json': {
                example: {
                  success: true,
                  data: {
                    totalEmployees: 45,
                    activeEmployees: 45,
                    departmentsCount: 8,
                    totalConsultationsThisMonth: 12,
                    totalSickLeaveDaysThisMonth: 8,
                    employeesOnSickLeaveCurrent: 2,
                  },
                },
              },
            },
          },
          401: {
            description: 'Non authentifie.',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
          },
          403: {
            description: 'Droits insuffisants (reserve exclusivement au role HR).',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
          },
        },
      },
    },
    '/api/hr/statistics': {
      get: {
        tags: ['Ressources Humaines & Reporting'],
        summary: 'Statistiques d\'activite consolidees par direction',
        description: 'Repartition anonymisee du volume de consultations et des jours d\'arret par direction/departement.',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'startDate', in: 'query', description: 'Date de debut (YYYY-MM-DD)', schema: { type: 'string' } },
          { name: 'endDate', in: 'query', description: 'Date de fin (YYYY-MM-DD)', schema: { type: 'string' } },
        ],
        responses: {
          200: {
            description: 'Statistiques recuperees avec succes.',
            content: {
              'application/json': {
                example: {
                  success: true,
                  data: {
                    period: { start: '2026-01-01T00:00:00.000Z', end: '2026-12-31T23:59:59.000Z' },
                    totalConsultations: 24,
                    totalSickLeaves: 4,
                    totalSickLeaveDays: 14,
                    byDepartment: [
                      { department: 'Direction des Systèmes d\'Information', employeeCount: 12, consultationCount: 6, sickLeaveDays: 3 },
                    ],
                  },
                },
              },
            },
          },
          401: {
            description: 'Non authentifie.',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
          },
          403: {
            description: 'Acces reserve au role HR.',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
          },
        },
      },
    },
    '/api/hr/statistics/diabetes': {
      get: {
        tags: ['Ressources Humaines & Reporting'],
        summary: 'Suivi agrege du diabete et consommation de bandelettes',
        description: 'Indicateurs consolides conformes a la spec V4 : nombre de patients suivis, tests effectues, bandelettes consommees et stock restant.',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Statistiques de diabete recuperees avec succes.',
            content: {
              'application/json': {
                example: {
                  success: true,
                  data: {
                    diabeticPatients: 28,
                    glycemiaChecks: 72,
                    stripConsumption: 72,
                    remainingStrips: 28,
                  },
                },
              },
            },
          },
          401: {
            description: 'Non authentifie.',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
          },
          403: {
            description: 'Acces reserve au role HR.',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
          },
        },
      },
    },
    '/api/hr/reports/export': {
      get: {
        tags: ['Ressources Humaines & Reporting'],
        summary: 'Exporter le rapport d\'activite RH au format PDF',
        description: 'Genere un rapport consolidé officiel A4 (charte graphique BCRG) contenant le resume des effectifs, l\'activite diabetique et la repartition par direction.',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Flux binaire du fichier PDF officiel RH.',
            content: {
              'application/pdf': {
                schema: { type: 'string', format: 'binary' },
              },
            },
          },
          401: {
            description: 'Non authentifie.',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
          },
          403: {
            description: 'Acces reserve au role HR.',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
          },
        },
      },
    },
    '/api/patient/vitals': {
      get: {
        tags: ['Espace Collaborateur - Patient'],
        summary: 'Historique des constantes vitales du collaborateur connecte',
        description: 'Retourne les dernieres constantes (tension, poids, temperature, calcul IMC) et la liste chronologique des mesures realisees en consultation.',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Constantes vitales recuperees avec succes.',
            content: {
              'application/json': {
                example: {
                  success: true,
                  data: {
                    summary: {
                      bloodPressure: '120/80',
                      weightKg: 75,
                      heightCm: 175,
                      temperatureC: 36.8,
                      bmi: 24.5,
                      bmiLabel: 'Normal',
                      bloodGroup: 'O+',
                      lastVisitDate: '2026-06-15T10:00:00.000Z',
                    },
                    history: [
                      {
                        id: 'uuid-vital',
                        consultationId: 'uuid-consultation',
                        measuredAt: '2026-06-15T10:00:00.000Z',
                        bloodPressure: '120/80',
                        temperatureC: 36.8,
                        weightKg: 75,
                        heightCm: 175,
                        bmi: 24.5,
                        bmiLabel: 'Normal',
                        bloodGroup: 'O+',
                      },
                    ],
                  },
                },
              },
            },
          },
          401: { description: 'Non authentifie.', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          404: { description: 'Fiche employe introuvable.', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/api/patient/documents': {
      get: {
        tags: ['Espace Collaborateur - Patient'],
        summary: 'Liste de tous les documents medicaux du collaborateur',
        description: 'Retourne l\'ensemble des documents du dossier : ordonnances emises par l\'infirmerie et documents de sante importes par le collaborateur.',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Liste des documents recuperee avec succes.',
            content: {
              'application/json': {
                example: {
                  success: true,
                  data: [
                    {
                      id: 'uuid-doc-1',
                      title: 'Ordonnance - 15 Juin 2026',
                      documentType: 'PRESCRIPTION',
                      mimeType: 'application/pdf',
                      fileSizeBytes: 24500,
                      createdAt: '2026-06-15T10:30:00.000Z',
                      isDoctorGenerated: true,
                      downloadUrl: '/api/patient/documents/uuid-doc-1/download',
                      viewUrl: '/api/patient/documents/uuid-doc-1/view',
                    },
                    {
                      id: 'uuid-doc-2',
                      title: 'Analyses_Sanguines_Juin2026.pdf',
                      documentType: 'LAB_RESULT',
                      mimeType: 'application/pdf',
                      fileSizeBytes: 142000,
                      createdAt: '2026-06-12T14:15:00.000Z',
                      isDoctorGenerated: false,
                      downloadUrl: '/api/patient/documents/uuid-doc-2/download',
                      viewUrl: '/api/patient/documents/uuid-doc-2/view',
                    },
                  ],
                },
              },
            },
          },
          401: { description: 'Non authentifie.', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/api/patient/documents/upload': {
      post: {
        tags: ['Espace Collaborateur - Patient'],
        summary: 'Importer un document medical (analyses, imagerie, compte rendu)',
        description: 'Permet au collaborateur de televerser un document externe (PDF, JPG, PNG jusqu\'a 10 Mo) en specifiant la categorie.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['documentType', 'file'],
                properties: {
                  documentType: {
                    type: 'string',
                    enum: ['LAB_RESULT', 'SPECIALIST_REPORT', 'IMAGING', 'MEDICAL_CERTIFICATE', 'OTHER'],
                    description: 'Type de document médical',
                    example: 'LAB_RESULT',
                  },
                  file: {
                    type: 'string',
                    format: 'binary',
                    description: 'Fichier PDF, JPEG ou PNG (max 10 Mo)',
                  },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Document importe avec succes.',
            content: {
              'application/json': {
                example: {
                  success: true,
                  message: 'Document médical importé avec succès dans votre dossier.',
                  data: {
                    id: 'uuid-doc',
                    title: 'Bilan_Sanguin.pdf',
                    documentType: 'LAB_RESULT',
                    mimeType: 'application/pdf',
                    fileSizeBytes: 85200,
                    createdAt: '2026-10-15T11:20:00.000Z',
                    isDoctorGenerated: false,
                    downloadUrl: '/api/patient/documents/uuid-doc/download',
                    viewUrl: '/api/patient/documents/uuid-doc/view',
                  },
                },
              },
            },
          },
          400: { description: 'Fichier manquant, format non autorise ou taille superieure a 10 Mo.', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          401: { description: 'Non authentifie.', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/api/patient/documents/{id}/view': {
      get: {
        tags: ['Espace Collaborateur - Patient'],
        summary: 'Visualiser un document en ligne (PDF / Image)',
        description: 'Affiche directement le document dans le navigateur ou dans la visionneuse de documents (Content-Disposition: inline). Protege par verification de propriete.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Identifiant UUID du document',
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          200: {
            description: 'Flux binaire du fichier (PDF ou Image).',
            content: {
              'application/pdf': { schema: { type: 'string', format: 'binary' } },
              'image/jpeg': { schema: { type: 'string', format: 'binary' } },
              'image/png': { schema: { type: 'string', format: 'binary' } },
            },
          },
          401: { description: 'Non authentifie.', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          404: { description: 'Document introuvable ou n\'appartenant pas au collaborateur.', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/api/patient/documents/{id}/download': {
      get: {
        tags: ['Espace Collaborateur - Patient'],
        summary: 'Telecharger un document medical',
        description: 'Declenche le telechargement securise du document en piece jointe (Content-Disposition: attachment).',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Identifiant UUID du document',
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          200: {
            description: 'Fichier binaire en telechargement.',
            content: {
              'application/pdf': { schema: { type: 'string', format: 'binary' } },
              'image/jpeg': { schema: { type: 'string', format: 'binary' } },
              'image/png': { schema: { type: 'string', format: 'binary' } },
            },
          },
          401: { description: 'Non authentifie.', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          404: { description: 'Document introuvable ou n\'appartenant pas au collaborateur.', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/api/patient/appointments/available-days': {
      get: {
        tags: ['Espace Collaborateur - Patient'],
        summary: 'Calendrier mensuel des disponibilités',
        description: 'Retourne pour chaque jour du mois son statut d\'ouverture (ouvert, weekend, passe) et le nombre de creneaux disponibles.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'month',
            in: 'query',
            required: true,
            description: 'Mois recherche au format YYYY-MM (ex: 2026-10)',
            schema: { type: 'string', example: '2026-10' },
          },
        ],
        responses: {
          200: {
            description: 'Disponibilites du mois recuperees avec succes.',
            content: {
              'application/json': {
                example: {
                  success: true,
                  data: {
                    month: '2026-10',
                    days: [
                      {
                        date: '2026-10-15',
                        dayNumber: 15,
                        dayOfWeek: 4,
                        dayName: 'Jeudi',
                        isPast: false,
                        isWeekend: false,
                        isAvailable: true,
                        availableSlotsCount: 12,
                      },
                    ],
                  },
                },
              },
            },
          },
          400: { description: 'Format de mois invalide.', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/api/patient/appointments/available-slots': {
      get: {
        tags: ['Espace Collaborateur - Patient'],
        summary: 'Creneaux horaires disponibles pour un jour donne',
        description: 'Calcule dynamiquement les creneaux horaires de 30 minutes encore libres (de 08h00 a 16h00) pour une date precise.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'date',
            in: 'query',
            required: true,
            description: 'Date cible au format YYYY-MM-DD (ex: 2026-10-16)',
            schema: { type: 'string', example: '2026-10-16' },
          },
        ],
        responses: {
          200: {
            description: 'Creneaux disponibles recuperes avec succes.',
            content: {
              'application/json': {
                example: {
                  success: true,
                  data: {
                    date: '2026-10-16',
                    formattedDate: 'Vendredi 16 Octobre 2026',
                    isWorkingDay: true,
                    totalSlots: 19,
                    availableSlots: [
                      '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
                      '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
                      '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'
                    ],
                    occupiedSlots: [],
                  },
                },
              },
            },
          },
          400: { description: 'Date invalide ou fermee.', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/api/patient/appointments': {
      post: {
        tags: ['Espace Collaborateur - Patient'],
        summary: 'Reserver un nouveau rendez-vous medical',
        description: 'Permet au collaborateur de reserver un creneau de consultation a l\'infirmerie BCRG. Le rendez-vous est cree en statut PROGRAMME.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['appointmentDate', 'scheduledTime', 'type'],
                properties: {
                  appointmentDate: { type: 'string', format: 'date', example: '2026-10-16' },
                  scheduledTime: { type: 'string', example: '09:00' },
                  type: { type: 'string', enum: ['GENERAL', 'PERIODIC', 'INSTANT'], example: 'GENERAL' },
                  reason: { type: 'string', example: 'Consultation générale et renouvellement d\'ordonnance' },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Rendez-vous reserve avec succes.',
            content: {
              'application/json': {
                example: {
                  success: true,
                  message: 'Votre rendez-vous a été programmé avec succès.',
                  data: {
                    id: 'uuid-appointment',
                    appointmentDate: '2026-10-16',
                    formattedDate: 'Vendredi 16 Octobre 2026',
                    scheduledTime: '09:00',
                    durationMinutes: 30,
                    type: 'GENERAL',
                    typeLabel: 'Consultation Générale',
                    status: 'SCHEDULED',
                    statusLabel: 'PROGRAMMÉ',
                    statusColor: 'yellow',
                    reason: 'Consultation générale',
                  },
                },
              },
            },
          },
          400: { description: 'Creneau deja occupe ou date invalide.', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/api/patient/appointments/my': {
      get: {
        tags: ['Espace Collaborateur - Patient'],
        summary: 'Liste de mes rendez-vous',
        description: 'Retourne l\'ensemble des rendez-vous a venir et passes du collaborateur connecte.',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Liste des rendez-vous recuperee avec succes.',
            content: {
              'application/json': {
                example: {
                  success: true,
                  data: [
                    {
                      id: 'uuid-app-1',
                      appointmentDate: '2026-10-16',
                      formattedDate: 'Vendredi 16 Octobre 2026',
                      scheduledTime: '09:00',
                      type: 'GENERAL',
                      typeLabel: 'Consultation Générale',
                      status: 'SCHEDULED',
                      statusLabel: 'PROGRAMMÉ',
                      statusColor: 'yellow',
                    },
                  ],
                },
              },
            },
          },
        },
      },
    },
    '/api/patient/appointments/{id}/cancel': {
      patch: {
        tags: ['Espace Collaborateur - Patient'],
        summary: 'Annuler un rendez-vous (patient)',
        description: 'Permet au collaborateur d\'annuler une reservation medicale.',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: { reason: { type: 'string', example: 'Contrainte professionnelle imprevue' } },
              },
            },
          },
        },
        responses: {
          200: { description: 'Rendez-vous annule avec succes.' },
          404: { description: 'Rendez-vous introuvable.' },
        },
      },
    },
    '/api/doctor/agenda': {
      get: {
        tags: ['Medecin - Agenda & Rendez-vous'],
        summary: 'Vue calendrier de l\'agenda medical (semaine ou mois)',
        description: 'Retourne tous les rendez-vous programmes et confirmes sur une plage temporelle avec l\'identite du patient.',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'startDate', in: 'query', required: true, schema: { type: 'string', example: '2026-10-12' } },
          { name: 'endDate', in: 'query', required: true, schema: { type: 'string', example: '2026-10-16' } },
        ],
        responses: {
          200: {
            description: 'Agenda recupere avec succes.',
            content: {
              'application/json': {
                example: {
                  success: true,
                  data: [
                    {
                      id: 'uuid-1',
                      appointmentDate: '2026-10-15',
                      formattedDate: 'Jeudi 15 Octobre 2026',
                      scheduledTime: '09:30',
                      patientName: 'Mamadou Diallo',
                      patientMatricule: 'MAT-2026-001',
                      type: 'GENERAL',
                      typeLabel: 'Consultation Générale',
                      status: 'CONFIRMED',
                      statusLabel: 'CONFIRMÉ',
                      statusColor: 'green',
                    },
                    {
                      id: 'uuid-2',
                      appointmentDate: '2026-10-15',
                      formattedDate: 'Jeudi 15 Octobre 2026',
                      scheduledTime: '14:00',
                      patientName: 'Aïssatou Camara',
                      patientMatricule: 'MAT-2026-002',
                      type: 'GENERAL',
                      typeLabel: 'Visite d\'embauche',
                      status: 'SCHEDULED',
                      statusLabel: 'PROGRAMMÉ',
                      statusColor: 'yellow',
                    },
                  ],
                },
              },
            },
          },
        },
      },
    },
    '/api/doctor/agenda/day/{date}': {
      get: {
        tags: ['Medecin - Agenda & Rendez-vous'],
        summary: 'Detail journalier pour le volet lateral droit',
        description: 'Fournit la liste complete et ordonnee des rendez-vous d\'une journee avec les motifs et actions rapides (approuver, reprogrammer).',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'date', in: 'path', required: true, schema: { type: 'string', example: '2026-10-15' } },
        ],
        responses: {
          200: {
            description: 'Detail de la journee recupere avec succes.',
            content: {
              'application/json': {
                example: {
                  success: true,
                  data: {
                    date: '2026-10-15',
                    formattedDate: 'Jeudi 15 Octobre',
                    totalAppointments: 2,
                    appointments: [],
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/doctor/agenda/appointments/{id}/approve': {
      patch: {
        tags: ['Medecin - Agenda & Rendez-vous'],
        summary: 'Approuver un rendez-vous (PROGRAMME -> CONFIRME)',
        description: 'Le medecin valide la demande de rendez-vous d\'un patient.',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: { doctorNotes: { type: 'string', example: 'Confirme pour 09:30' } },
              },
            },
          },
        },
        responses: {
          200: { description: 'Rendez-vous approuve avec succes.' },
        },
      },
    },
    '/api/doctor/agenda/appointments/{id}/reschedule': {
      patch: {
        tags: ['Medecin - Agenda & Rendez-vous'],
        summary: 'Reprogrammer un rendez-vous',
        description: 'Deplace le rendez-vous vers une autre date et un autre creneau.',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['newDate', 'newTime'],
                properties: {
                  newDate: { type: 'string', format: 'date', example: '2026-10-19' },
                  newTime: { type: 'string', example: '11:00' },
                  reason: { type: 'string', example: 'Indisponibilite du praticien' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Rendez-vous reprogramme avec succes.' },
        },
      },
    },
    '/api/doctor/agenda/appointments/{id}/cancel': {
      patch: {
        tags: ['Medecin - Agenda & Rendez-vous'],
        summary: 'Annuler ou refuser un rendez-vous (medecin)',
        description: 'Annule un rendez-vous avec notification du motif.',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['reason'],
                properties: { reason: { type: 'string', example: 'Urgence hospitaliere' } },
              },
            },
          },
        },
        responses: {
          200: { description: 'Rendez-vous annule.' },
        },
      },
    },
    '/api/hr/periodicity/settings': {
      get: {
        tags: ['Ressources Humaines - Periodicite des Visites'],
        summary: 'Parametres actuels de periodicite des visites obligatoires',
        description: 'Retourne les frequences definies pour le personnel standard (12 mois), le Suivi Medical Renforce - SMR (6 mois) et le delai d\'alerte RH (30 jours).',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Configuration recuperee avec succes.',
            content: {
              'application/json': {
                example: {
                  success: true,
                  data: {
                    id: 'uuid-setting',
                    standardFrequencyMonths: 12,
                    standardFrequencyLabel: 'Tous les 12 mois',
                    smrFrequencyMonths: 6,
                    smrFrequencyLabel: 'Tous les 6 mois',
                    reminderLeadDays: 30,
                    reminderLeadLabel: '30 jours avant',
                    updatedAt: '2026-10-15T10:00:00.000Z',
                  },
                },
              },
            },
          },
        },
      },
      put: {
        tags: ['Ressources Humaines - Periodicite des Visites'],
        summary: 'Enregistrer les modifications de periodicite',
        description: 'Met a jour la politique de periodicite des visites medicales.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['standardFrequencyMonths', 'smrFrequencyMonths', 'reminderLeadDays'],
                properties: {
                  standardFrequencyMonths: { type: 'integer', example: 12 },
                  smrFrequencyMonths: { type: 'integer', example: 6 },
                  reminderLeadDays: { type: 'integer', example: 30 },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Configuration enregistree avec succes.' },
        },
      },
    },
    '/api/hr/periodicity/due-employees': {
      get: {
        tags: ['Ressources Humaines - Periodicite des Visites'],
        summary: 'Suivi et relances des visites medicales obligatoires',
        description: 'Analyse l\'ensemble des employes, detecte le profil SMR (chauffeurs, gardes, convoyeurs), calcule les prochaines echeances et fournit le taux de couverture.',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Synthese et liste des employes a relancer.',
            content: {
              'application/json': {
                example: {
                  success: true,
                  data: {
                    totalEmployees: 3,
                    upToDateCount: 3,
                    dueSoonCount: 0,
                    overdueCount: 0,
                    smrCount: 1,
                    coverageRatePercent: 100,
                    employees: [
                      {
                        patientId: 'uuid-patient',
                        matricule: 'MAT-2026-001',
                        fullName: 'Mamadou Diallo',
                        department: 'Direction Informatique',
                        jobTitle: 'Ingénieur Systèmes',
                        isSmr: false,
                        frequencyMonths: 12,
                        lastVisitFormatted: '15 oct. 2026',
                        nextDueDateFormatted: '15 oct. 2027',
                        daysRemaining: 365,
                        status: 'UP_TO_DATE',
                        statusLabel: 'À jour',
                      },
                    ],
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Jeton d\'authentification Bearer JWT obtenu via /api/auth/login.',
      },
    },
    schemas: {
      LoginInput: {
        type: 'object',
        required: ['matricule', 'password'],
        properties: {
          matricule: {
            type: 'string',
            description: 'Matricule officiel BCRG (chiffres uniquement)',
            example: '2004',
          },
          password: {
            type: 'string',
            format: 'password',
            description: 'Mot de passe du collaborateur',
            example: 'ChangeMe@2026!',
          },
        },
      },
      ChangeInitialPasswordInput: {
        type: 'object',
        required: ['currentPassword', 'newPassword', 'confirmPassword'],
        properties: {
          currentPassword: {
            type: 'string',
            format: 'password',
            description: 'Mot de passe temporaire actuel',
            example: 'ChangeMe@2026!',
          },
          newPassword: {
            type: 'string',
            format: 'password',
            description: 'Nouveau mot de passe (min 8 caracteres, majuscule, minuscule, chiffre, symbole)',
            example: 'BcrgSecure#2026',
          },
          confirmPassword: {
            type: 'string',
            format: 'password',
            description: 'Confirmation identique du nouveau mot de passe',
            example: 'BcrgSecure#2026',
          },
        },
      },
      AuthSuccessResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Bienvenue, Vous êtes connecté !' },
          data: {
            type: 'object',
            properties: {
              user: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  matricule: { type: 'string', example: '2004' },
                  email: { type: 'string', example: 'mamadoub.barry@bcrg-guinee.org' },
                  firstName: { type: 'string', example: 'Mamadou BANO' },
                  lastName: { type: 'string', example: 'BARRY' },
                  phone: { type: 'string', example: '+224627000000' },
                  department: { type: 'string', example: 'Direction des Systèmes d\'Information' },
                  jobTitle: { type: 'string', example: 'Ingénieur Logiciel DSI' },
                  role: { type: 'string', enum: ['DOCTOR', 'EMPLOYEE', 'HR'], example: 'HR' },
                  isFirstLogin: { type: 'boolean', example: true },
                  patient: {
                    type: 'object',
                    nullable: true,
                    properties: {
                      id: { type: 'string', format: 'uuid' },
                      bloodGroup: { type: 'string', example: 'O+' },
                    },
                  },
                },
              },
              tokens: {
                type: 'object',
                properties: {
                  accessToken: { type: 'string', example: 'eyJhbGciOiJIUzI1Ni...' },
                  refreshToken: { type: 'string', example: 'eyJhbGciOiJIUzI1Ni...' },
                },
              },
            },
          },
        },
      },
      UserProfileResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              matricule: { type: 'string', example: '2004' },
              email: { type: 'string', example: 'mamadoub.barry@bcrg-guinee.org' },
              firstName: { type: 'string', example: 'Mamadou BANO' },
              lastName: { type: 'string', example: 'BARRY' },
              role: { type: 'string', example: 'HR' },
              phone: { type: 'string', example: '+224627000000' },
              department: { type: 'string', example: 'Direction des Systèmes d\'Information' },
              jobTitle: { type: 'string', example: 'Ingénieur Logiciel DSI' },
              isFirstLogin: { type: 'boolean', example: false },
              isActive: { type: 'boolean', example: true },
              lastLoginAt: { type: 'string', format: 'date-time' },
              createdAt: { type: 'string', format: 'date-time' },
              patient: {
                type: 'object',
                nullable: true,
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  gender: { type: 'string', example: 'M' },
                  bloodGroup: { type: 'string', example: 'O+' },
                  medicalHistory: { type: 'string', example: 'Asthme modéré dans l\'enfance' },
                },
              },
            },
          },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Donnees envoyées non valides' },
          errors: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                field: { type: 'string', example: 'phone' },
                message: { type: 'string', example: 'Le format du numero de telephone est invalide' },
              },
            },
            nullable: true,
          },
        },
      },
      CreateEmployeeInput: {
        type: 'object',
        required: ['matricule', 'firstName', 'lastName', 'gender', 'department', 'jobTitle'],
        properties: {
          matricule: { type: 'string', example: '2004' },
          firstName: { type: 'string', example: 'Mamadou BANO' },
          lastName: { type: 'string', example: 'BARRY' },
          email: { type: 'string', format: 'email', description: 'Adresse email professionnelle unique', example: 'mamadoub.barry@bcrg-guinee.org' },
          phone: { type: 'string', description: 'Numero de telephone unique du collaborateur', example: '+224627000000' },
          gender: { type: 'string', enum: ['M', 'F'], example: 'M' },
          department: { type: 'string', example: 'Direction des Systèmes d\'Information' },
          jobTitle: { type: 'string', example: 'Ingénieur Logiciel DSI' },
          bloodGroup: { type: 'string', enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], example: 'O+' },
          medicalHistory: { type: 'string', example: 'Asthme modere dans l\'enfance, aucun antecedent chirurgical.' },
        },
      },
      UpdateEmployeeInput: {
        type: 'object',
        properties: {
          phone: { type: 'string', description: 'Nouveau numero de telephone unique', example: '+224627000000' },
          department: { type: 'string', example: 'Direction des Systèmes d\'Information' },
          jobTitle: { type: 'string', example: 'Ingénieur Logiciel DSI' },
          bloodGroup: { type: 'string', enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], example: 'O+' },
          medicalHistory: { type: 'string', example: 'Asthme modere dans l\'enfance, aucun antecedent chirurgical.' },
        },
      },
      AddEmployeeAllergyInput: {
        type: 'object',
        required: ['allergyType', 'substance'],
        properties: {
          allergyType: {
            type: 'string',
            enum: ['DRUG', 'FOOD', 'OCCUPATIONAL', 'OTHER'],
            example: 'DRUG',
          },
          substance: { type: 'string', example: 'Penicilline' },
          reactionDetails: { type: 'string', example: 'Urticaire generalisee' },
          severity: {
            type: 'string',
            enum: ['MILD', 'MODERATE', 'SEVERE'],
            default: 'MODERATE',
            example: 'SEVERE',
          },
        },
      },
      AllergyDetailResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Allergie enregistree sur la fiche employe.' },
          data: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              patientId: { type: 'string', format: 'uuid', description: 'Identifiant unique de l\'employe' },
              allergyType: { type: 'string', example: 'DRUG' },
              substance: { type: 'string', example: 'Penicilline' },
              reactionDetails: { type: 'string', example: 'Urticaire' },
              severity: { type: 'string', example: 'SEVERE' },
              createdAt: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
      EmployeeDetailResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Employe enrole avec succes.' },
          data: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid', description: 'Identifiant unique de la fiche medicale patient' },
              gender: { type: 'string', example: 'M' },
              bloodGroup: { type: 'string', example: 'O+' },
              medicalHistory: { type: 'string', example: 'Asthme modere dans l\'enfance, aucun antecedent chirurgical.' },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
              user: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  matricule: { type: 'string', example: '2004' },
                  firstName: { type: 'string', example: 'Mamadou BANO' },
                  lastName: { type: 'string', example: 'BARRY' },
                  email: { type: 'string', example: 'mamadoub.barry@bcrg-guinee.org' },
                  phone: { type: 'string', example: '+224627000000' },
                  department: { type: 'string', example: 'Direction des Systèmes d\'Information' },
                  jobTitle: { type: 'string', example: 'Ingénieur Logiciel DSI' },
                  role: { type: 'string', example: 'EMPLOYEE' },
                },
              },
              allergies: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', format: 'uuid' },
                    allergyType: { type: 'string', example: 'DRUG' },
                    substance: { type: 'string', example: 'Penicilline' },
                    severity: { type: 'string', example: 'SEVERE' },
                  },
                },
              },
            },
          },
        },
      },
      EmployeeListResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string', format: 'uuid' },
                gender: { type: 'string', example: 'M' },
                bloodGroup: { type: 'string', example: 'O+' },
                user: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', format: 'uuid' },
                    matricule: { type: 'string', example: '2004' },
                    firstName: { type: 'string', example: 'Mamadou BANO' },
                    lastName: { type: 'string', example: 'BARRY' },
                    email: { type: 'string', example: 'mamadoub.barry@bcrg-guinee.org' },
                    phone: { type: 'string', example: '+224627000000' },
                    department: { type: 'string', example: 'Direction des Systèmes d\'Information' },
                    jobTitle: { type: 'string', example: 'Ingénieur Logiciel DSI' },
                  },
                },
                allergies: { type: 'array', items: { type: 'object' } },
              },
            },
          },
          pagination: {
            type: 'object',
            properties: {
              page: { type: 'integer', example: 1 },
              limit: { type: 'integer', example: 10 },
              total: { type: 'integer', example: 1 },
              totalPages: { type: 'integer', example: 1 },
            },
          },
        },
      },
      ConsultationStatsResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: {
            type: 'object',
            properties: {
              consultationsThisMonth: { type: 'integer', example: 2 },
              recentEmergencies: { type: 'integer', example: 1 },
              waitingOrInProgressToday: { type: 'integer', example: 0 },
            },
          },
        },
      },
      CreateConsultationInput: {
        type: 'object',
        required: ['patientId', 'reason'],
        properties: {
          patientId: { type: 'string', format: 'uuid', description: 'Identifiant unique du patient' },
          type: { type: 'string', enum: ['GENERAL', 'INSTANT', 'PERIODIC'], default: 'GENERAL' },
          reason: { type: 'string', description: 'Motif de consultation ou plaintes du patient', example: 'Maux de tête persistants' },
          symptoms: { type: 'string', description: 'Description detaillee des symptomes', example: 'Céphalée frontale et vertiges' },
          physicalExamination: { type: 'string', description: 'Constatations cliniques du medecin', example: 'Auscultation normale' },
          diagnosis: { type: 'string', description: 'Diagnostic rapide (optionnel au demarrage)', example: 'Céphalée de tension' },
          advice: { type: 'string', description: 'Conseils therapeutiques ou notes internes', example: 'Repos au calme' },
          vitals: {
            type: 'object',
            properties: {
              bloodPressure: { type: 'string', description: 'Tension (ex: "120/80")', example: '120/80' },
              temperatureC: { type: 'number', description: 'Temperature en degres Celsius', example: 37.2 },
              heightCm: { type: 'number', description: 'Taille en cm', example: 175 },
              weightKg: { type: 'number', description: 'Poids en kg', example: 70 },
              bloodGroup: { type: 'string', enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], description: 'Groupe sanguin du patient', example: 'O+' },
            },
          },
          glycemia: {
            type: 'object',
            description: 'Contrôle glycémique intégré (1 contrôle effectué = 1 bandelette consommée)',
            properties: {
              performed: { type: 'boolean', default: true, example: true },
              value: { type: 'number', description: 'Valeur de la glycémie', example: 1.18 },
              unit: { type: 'string', default: 'g/L', example: 'g/L' },
            },
          },
        },
      },
      UpdateConsultationInput: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['WAITING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'], example: 'COMPLETED' },
          type: { type: 'string', enum: ['GENERAL', 'INSTANT', 'PERIODIC'] },
          reason: { type: 'string' },
          symptoms: { type: 'string' },
          physicalExamination: { type: 'string' },
          diagnosis: { type: 'string', example: 'Céphalée de tension confirmée' },
          advice: { type: 'string', example: 'Repos 48h et ordonnance transmise' },
          vitals: {
            type: 'object',
            properties: {
              bloodPressure: { type: 'string', example: '120/80' },
              temperatureC: { type: 'number', example: 37.2 },
              heightCm: { type: 'number', example: 175 },
              weightKg: { type: 'number', example: 70 },
              bloodGroup: { type: 'string', example: 'O+' },
            },
          },
          glycemia: {
            type: 'object',
            properties: {
              performed: { type: 'boolean', default: true, example: true },
              value: { type: 'number', example: 1.20 },
              unit: { type: 'string', default: 'g/L', example: 'g/L' },
            },
          },
        },
      },
      AddPrescriptionInput: {
        type: 'object',
        required: ['medicationName', 'dosage', 'duration'],
        properties: {
          medicationName: { type: 'string', example: 'Paracétamol 1000mg' },
          dosage: { type: 'string', example: '1 comprimé' },
          frequency: { type: 'string', example: '3 fois par jour' },
          duration: { type: 'string', example: '5 jours' },
          instructions: { type: 'string', example: 'Au cours des repas' },
        },
      },
      ConsultationDetailResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              consultationDate: { type: 'string', format: 'date-time' },
              type: { type: 'string', example: 'GENERAL' },
              status: { type: 'string', example: 'IN_PROGRESS' },
              reason: { type: 'string' },
              symptoms: { type: 'string' },
              diagnosis: { type: 'string', nullable: true },
              advice: { type: 'string', nullable: true },
              patient: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  registrationNumber: { type: 'string', example: '2004' },
                  gender: { type: 'string', example: 'M' },
                  department: { type: 'string', example: 'Direction des Systèmes d\'Information' },
                  jobTitle: { type: 'string', example: 'Ingénieur Logiciel DSI' },
                  bloodGroup: { type: 'string', example: 'O+' },
                  user: { type: 'object' },
                  allergies: { type: 'array', items: { type: 'object' } },
                },
              },
              vitalSigns: { type: 'array', items: { type: 'object' } },
              glycemia: {
                type: 'object',
                nullable: true,
                properties: {
                  performed: { type: 'boolean', example: true },
                  value: { type: 'number', example: 1.18 },
                  unit: { type: 'string', example: 'g/L' },
                  measuredAt: { type: 'string', format: 'date-time' },
                },
              },
              prescriptions: { type: 'array', items: { type: 'object' } },
              latestVitalsSummary: {
                type: 'object',
                nullable: true,
                properties: {
                  bloodPressure: { type: 'string', example: '120/80' },
                  temperatureC: { type: 'number', example: 37.2 },
                  heightCm: { type: 'number', example: 175 },
                  weightKg: { type: 'number', example: 70 },
                  bmi: { type: 'number', example: 22.9 },
                  bmiLabel: { type: 'string', example: 'Normal' },
                  bloodGroup: { type: 'string', example: 'O+' },
                },
              },
            },
          },
        },
      },
      ConsultationListResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string', format: 'uuid' },
                consultationDate: { type: 'string', format: 'date-time' },
                type: { type: 'string', example: 'GENERAL' },
                status: { type: 'string', example: 'COMPLETED' },
                reason: { type: 'string' },
                diagnosis: { type: 'string', nullable: true },
                patient: { type: 'object' },
                doctor: { type: 'object' },
                glycemia: {
                  type: 'object',
                  nullable: true,
                  properties: {
                    performed: { type: 'boolean', example: true },
                    value: { type: 'number', example: 1.18 },
                    unit: { type: 'string', example: 'g/L' },
                  },
                },
                vitalSigns: { type: 'object', nullable: true },
                prescriptionsCount: { type: 'integer', example: 1 },
              },
            },
          },
          pagination: {
            type: 'object',
            properties: {
              page: { type: 'integer', example: 1 },
              limit: { type: 'integer', example: 10 },
              total: { type: 'integer', example: 2 },
              totalPages: { type: 'integer', example: 1 },
            },
          },
        },
      },
      MedicalDocumentItem: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          patientId: { type: 'string', format: 'uuid' },
          consultationId: { type: 'string', format: 'uuid', nullable: true },
          title: { type: 'string', example: 'Ordonnance - 06 oct. 2026' },
          documentType: { type: 'string', example: 'PRESCRIPTION' },
          mimeType: { type: 'string', example: 'application/pdf' },
          fileSize: { type: 'integer', example: 14500 },
          createdAt: { type: 'string', format: 'date-time' },
          viewUrl: { type: 'string', example: '/api/doctor/documents/c8872f2d-88b0-466d-8e47-e2a2ba784382/view' },
          downloadUrl: { type: 'string', example: '/api/doctor/documents/c8872f2d-88b0-466d-8e47-e2a2ba784382/download' },
        },
      },
      MedicalDocumentSingleResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Ordonnance générée et enregistrée avec succès.' },
          data: { $ref: '#/components/schemas/MedicalDocumentItem' },
        },
      },
      MedicalDocumentListResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: {
            type: 'array',
            items: { $ref: '#/components/schemas/MedicalDocumentItem' },
          },
        },
      },
      DoctorDashboardResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Données du tableau de bord médecin récupérées avec succès.' },
          data: {
            type: 'object',
            properties: {
              kpis: {
                type: 'object',
                properties: {
                  consultationsToday: { type: 'integer', example: 2 },
                  activeConsultations: { type: 'integer', example: 2 },
                  departmentsCount: { type: 'integer', example: 12 },
                  patientsExaminedCount: { type: 'integer', example: 15 },
                  usersCount: { type: 'integer', example: 4 },
                },
              },
              diabetesKpis: {
                type: 'object',
                description: 'KPIs diabète et consommation de bandelettes',
                properties: {
                  diabeticPatients: { type: 'integer', example: 5 },
                  glycemiaChecks: { type: 'integer', example: 12 },
                  stripConsumption: { type: 'integer', example: 12 },
                  remainingStrips: { type: 'integer', example: 88 },
                },
              },
              diabeticMonthlyPassages: {
                type: 'array',
                description: 'Suivi des passages mensuels des collaborateurs diabétiques',
                items: {
                  type: 'object',
                  properties: {
                    patientId: { type: 'string', format: 'uuid' },
                    patientName: { type: 'string', example: 'Mamadou Diallo' },
                    registrationNumber: { type: 'string', example: 'MAT-2026-001' },
                    department: { type: 'string', example: 'Direction des Systèmes d\'Information' },
                    monthlyVisits: { type: 'integer', example: 2 },
                    lastCheckDate: { type: 'string', format: 'date-time' },
                    lastGlycemiaValue: { type: 'number', example: 1.15 },
                    lastGlycemiaUnit: { type: 'string', example: 'g/L' },
                  },
                },
              },
              weeklyActivity: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    day: { type: 'string', example: 'LUN' },
                    date: { type: 'string', example: '2026-10-05' },
                    count: { type: 'integer', example: 2 },
                  },
                },
              },
              alerts: {
                type: 'object',
                properties: {
                  pendingCount: { type: 'integer', example: 0 },
                  items: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'string', example: 'alert-1' },
                        type: { type: 'string', example: 'STOCK_ALERT' },
                        severity: { type: 'string', example: 'CRITICAL' },
                        title: { type: 'string', example: 'Rupture de stock : Paracétamol' },
                        description: { type: 'string', example: 'Le stock est en dessous du seuil critique (5 boîtes restantes).' },
                        actionLabel: { type: 'string', example: 'Commander' },
                        actionUrl: { type: 'string', example: '/pharmacie' },
                      },
                    },
                  },
                },
              },
              recentConsultations: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', format: 'uuid' },
                    patientName: { type: 'string', example: 'Mamadou Diallo' },
                    patientMatricule: { type: 'string', example: 'MAT-2026-001' },
                    consultationDate: { type: 'string', format: 'date-time' },
                    formattedDate: { type: 'string', example: '06 oct. 2026' },
                    type: { type: 'string', example: 'GENERAL' },
                    typeLabel: { type: 'string', example: 'GENERAL' },
                    status: { type: 'string', example: 'COMPLETED' },
                    statusLabel: { type: 'string', example: 'TERMINEE' },
                  },
                },
              },
              quickActions: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    key: { type: 'string', example: 'new_patient' },
                    label: { type: 'string', example: 'Nouveau Patient' },
                    subtitle: { type: 'string', example: 'Ajouter un dossier médical' },
                    route: { type: 'string', example: '/dossiers-medicaux/nouveau' },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};

/**
 * Configure et monte l'interface interactive Swagger UI et les exports statiques sur l'application Express.
 *
 * @param app Application Express
 */
export const setupSwagger = (app: Application): void => {
  // 1. Mise a disposition du document OpenAPI brut au format JSON
  app.get('/api/docs.json', (_req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerDocument);
  });

  // 2. Telechargement direct du fichier openapi-infirmerie-bcrg.json en piece jointe
  app.get('/api/docs/download', (_req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="openapi-med-bcrg.json"'
    );
    res.send(JSON.stringify(swaggerDocument, null, 2));
  });

  // 3. Vue autonome Redoc (documentation HTML statique haut de gamme pour partage direct)
  app.get('/api/docs/redoc', (_req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/html');
    res.send(`<!DOCTYPE html>
<html>
  <head>
    <title>Documentation API - MED BCRG</title>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link href="https://fonts.googleapis.com/css?family=Montserrat:300,400,700|Roboto:300,400,700" rel="stylesheet">
    <style>
      body { margin: 0; padding: 0; }
    </style>
  </head>
  <body>
    <redoc spec-url='/api/docs.json'></redoc>
    <script src="https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js"></script>
  </body>
</html>`);
  });

  // 4. Interface utilisateur interactive Swagger UI
  app.use(
    '/api/docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerDocument, {
      customSiteTitle: 'Documentation API - Infirmerie BCRG',
      customCss: `
        .swagger-ui .topbar { display: none }
        .swagger-ui .info { margin-bottom: 20px; }
      `,
      swaggerOptions: {
        persistAuthorization: true,
      },
    })
  );
};
