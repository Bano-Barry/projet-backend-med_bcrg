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
      name: 'Supervision',
      description: 'Endpoints techniques de disponibilite et d\'informations systeme.',
    },
    {
      name: 'Medecin - Consultations',
      description: 'Espace clinique dedie au medecin (demarrage de consultation, constantes vitales, ordonnances et KPIs).',
    },
    {
      name: 'Medecin - Dossiers & Recherche',
      description: 'Recherche rapide de patients et consultation du dossier medical complet par le personnel soignant.',
    },
  ],
  paths: {
    '/': {
      get: {
        tags: ['Supervision'],
        summary: 'Metadonnees de l\'API',
        description: 'Retourne les informations generales sur le service et les points d\'entree disponibles.',
        responses: {
          200: {
            description: 'Informations du service recuperees avec succes.',
            content: {
              'application/json': {
                example: {
                  name: 'API Infirmerie BCRG',
                  version: '1.0.0',
                  status: 'UP',
                  description: 'Systeme de gestion de l\'infirmerie de la Banque Centrale de la Republique de Guinee',
                  endpoints: {
                    health: '/api/health',
                    auth: '/api/auth',
                    docs: '/api/docs',
                  },
                },
              },
            },
          },
        },
      },
    },
    // '/api/health': {
    //   get: {
    //     tags: ['Supervision'],
    //     summary: 'Verification de sante du serveur',
    //     description: 'Controle si le service backend est actif et operationnel.',
    //     responses: {
    //       200: {
    //         description: 'Serveur en ligne.',
    //         content: {
    //           'application/json': {
    //             example: {
    //               status: 'UP',
    //               service: 'backend-med-bcrg',
    //               timestamp: '2026-09-30T09:00:00.000Z',
    //               environment: 'development',
    //             },
    //           },
    //         },
    //       },
    //     },
    //   },
    // },
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
                reason: 'Maux de tête persistants depuis 3 jours, légère fièvre.',
                diagnosis: 'Céphalée de tension et fatigue générale',
                advice: 'Repos recommandé, bonne hydratation',
                vitals: {
                  bloodPressure: '130/85',
                  temperatureC: 37.8,
                  heightCm: 178,
                  weightKg: 75,
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
        description: 'Recupere l\'integralite des informations de la consultation : patient, constantes, ordonnances et diagnostic.',
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
        description: 'Permet de mettre a jour le diagnostic, les notes ou de passer le statut a COMPLETED (TERMINEE).',
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
                diagnosis: 'Céphalée de tension confirmée',
                advice: 'Ordonnance délivrée, repos 48h',
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
                  isAbnormal: { type: 'boolean', example: false },
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
