-- backend/src/config/seed.sql
-- Questionnaire IFOSUP — 3 sections, 3 templates
SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE survey_answers;

TRUNCATE TABLE survey_responses;

TRUNCATE TABLE survey_sessions;

TRUNCATE TABLE form_question_options;

TRUNCATE TABLE form_questions;

TRUNCATE TABLE form_templates;

TRUNCATE TABLE users;

SET FOREIGN_KEY_CHECKS = 1;

-- -------------------------------------------------------
-- USERS (mot de passe : "password" pour tous)
-- -------------------------------------------------------
INSERT INTO
    users (
        id,
        email,
        password_hash,
        role,
        first_name,
        last_name
    )
VALUES (
        1,
        'admin@ifosup.be',
        '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
        'admin',
        'Admin',
        'IFOSUP'
    ),
    (
        2,
        'prof.dupont@ifosup.be',
        '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
        'teacher',
        'Jean',
        'Dupont'
    ),
    (
        3,
        'prof.martin@ifosup.be',
        '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
        'teacher',
        'Sophie',
        'Martin'
    );

-- -------------------------------------------------------
-- FORM TEMPLATES
-- -------------------------------------------------------
INSERT INTO
    form_templates (
        id,
        owner_user_id,
        title,
        description,
        is_global
    )
VALUES (
        1,
        1,
        'Évaluation cours — Section commune',
        'Questions communes à tous les cours (Section 1)',
        TRUE
    ),
    (
        2,
        1,
        'Évaluation cours de langue',
        'Questions spécifiques aux cours de langue (Sections 1+2)',
        TRUE
    ),
    (
        3,
        1,
        'Évaluation UE de section',
        'Questions spécifiques aux UEs (Sections 1+3)',
        TRUE
    );

-- -------------------------------------------------------
-- QUESTIONS — TEMPLATE 1 : Section commune (4 questions)
-- -------------------------------------------------------
INSERT INTO
    form_questions (
        id,
        form_template_id,
        type,
        label,
        help_text,
        is_required,
        order_index
    )
VALUES (
        1,
        1,
        'radio',
        'Comment évalues-tu globalement ce cours ?',
        NULL,
        TRUE,
        1
    ),
    (
        2,
        1,
        'textarea',
        'Qu\'est-ce que ce cours t\'a apporté ?',
        'Qu\'as-tu appris ou réalisé ? Qu\'est-ce qui t\'a été utile pour d\'autres cours, au travail, dans ta vie privée ?',
        FALSE,
        2
    ),
    (
        3,
        1,
        'textarea',
        'Qu\'est-ce qui pourrait être amélioré pour faciliter l\'apprentissage ?',
        'Par exemple : rythme du cours, consignes, matériel, organisation, quantité de matière...',
        FALSE,
        3
    ),
    (
        4,
        1,
        'textarea',
        'Quelle(s) activité(s) t\'a ou t\'ont le plus aidé(e) à apprendre/progresser ?',
        'Par exemple les mises en pratiques, les échanges avec les autres étudiants, les activités de groupe...',
        FALSE,
        4
    );

-- Options Q1 — évaluation globale
INSERT INTO
    form_question_options (
        question_id,
        label,
        value,
        order_index
    )
VALUES (
        1,
        'Très bien',
        'tres_bien',
        1
    ),
    (1, 'Bien', 'bien', 2),
    (
        1,
        'Je suis mitigé(e)',
        'mitige',
        3
    ),
    (
        1,
        'Plutôt mauvais',
        'mauvais',
        4
    ),
    (
        1,
        'Très mauvais',
        'tres_mauvais',
        5
    );

-- -------------------------------------------------------
-- QUESTIONS — TEMPLATE 2 : Cours de langue (Section 1 + Section 2)
-- (On reprend les 4 questions communes + 3 spécifiques langue)
-- -------------------------------------------------------
INSERT INTO
    form_questions (
        id,
        form_template_id,
        type,
        label,
        help_text,
        is_required,
        order_index
    )
VALUES
    -- Section 1 communes
    (
        5,
        2,
        'radio',
        'Comment évalues-tu globalement ce cours ?',
        NULL,
        TRUE,
        1
    ),
    (
        6,
        2,
        'textarea',
        'Qu\'est-ce que ce cours t\'a apporté ?',
        'Qu\'as-tu appris ou réalisé ? Qu\'est-ce qui t\'a été utile ?',
        FALSE,
        2
    ),
    (
        7,
        2,
        'textarea',
        'Qu\'est-ce qui pourrait être amélioré pour faciliter l\'apprentissage ?',
        'Par exemple : rythme, consignes, matériel...',
        FALSE,
        3
    ),
    (
        8,
        2,
        'textarea',
        'Quelle(s) activité(s) t\'a ou t\'ont le plus aidé(e) à apprendre/progresser ?',
        'Par exemple les mises en pratiques, les échanges avec les autres étudiants...',
        FALSE,
        4
    ),
    -- Section 2 spécifique langue
    (
        9,
        2,
        'matrix',
        'Ce cours t\'a permis de progresser dans les domaines suivants :',
        'Évalue chaque compétence : Écouter, Lire, Parler en continu, Parler à plusieurs, Écrire',
        FALSE,
        5
    ),
    (
        10,
        2,
        'matrix',
        'À propos des activités proposées : indique ce qui te semble juste.',
        'Évalue la fréquence et la difficulté pour : Écouter, Lire, Parler, Écrire',
        FALSE,
        6
    ),
    (
        11,
        2,
        'textarea',
        'Qu\'as-tu trouvé le plus motivant dans ce cours ?',
        'Par exemple, une activité, un sujet, une méthode...',
        FALSE,
        7
    );

-- Options Q5 — évaluation globale (template 2)
INSERT INTO
    form_question_options (
        question_id,
        label,
        value,
        order_index
    )
VALUES (
        5,
        'Très bien',
        'tres_bien',
        1
    ),
    (5, 'Bien', 'bien', 2),
    (
        5,
        'Je suis mitigé(e)',
        'mitige',
        3
    ),
    (
        5,
        'Plutôt mauvais',
        'mauvais',
        4
    ),
    (
        5,
        'Très mauvais',
        'tres_mauvais',
        5
    );

-- -------------------------------------------------------
-- QUESTIONS — TEMPLATE 3 : UE de section (Section 1 + Section 3)
-- -------------------------------------------------------
INSERT INTO
    form_questions (
        id,
        form_template_id,
        type,
        label,
        help_text,
        is_required,
        order_index
    )
VALUES
    -- Section 1 communes
    (
        12,
        3,
        'radio',
        'Comment évalues-tu globalement ce cours ?',
        NULL,
        TRUE,
        1
    ),
    (
        13,
        3,
        'textarea',
        'Qu\'est-ce que ce cours t\'a apporté ?',
        NULL,
        FALSE,
        2
    ),
    (
        14,
        3,
        'textarea',
        'Qu\'est-ce qui pourrait être amélioré pour faciliter l\'apprentissage ?',
        NULL,
        FALSE,
        3
    ),
    (
        15,
        3,
        'textarea',
        'Quelle(s) activité(s) t\'a ou t\'ont le plus aidé(e) à apprendre/progresser ?',
        NULL,
        FALSE,
        4
    ),
    -- Section 3 spécifique UE
    (
        16,
        3,
        'radio',
        'Ce que tu as appris dans ce cours te semble-t-il utile pour ton futur métier ?',
        NULL,
        TRUE,
        5
    ),
    (
        17,
        3,
        'radio',
        'Les exercices ou projets proposés dans ce cours t\'ont semblé :',
        NULL,
        TRUE,
        6
    ),
    (
        18,
        3,
        'textarea',
        'Tu peux expliquer ta réponse si tu veux :',
        'Réponse ouverte facultative',
        FALSE,
        7
    ),
    (
        19,
        3,
        'textarea',
        'As-tu fait des liens avec d\'autres cours de ta formation ? Si oui, lesquels ?',
        NULL,
        FALSE,
        8
    ),
    -- Section 1 Q5 et Section 3 Q5+Q6
    (
        20,
        3,
        'radio',
        'Comment décrirais-tu l\'ambiance de travail dans ce cours ?',
        NULL,
        FALSE,
        9
    ),
    (
        21,
        3,
        'textarea',
        'As-tu des suggestions ou un commentaire à partager ?',
        NULL,
        FALSE,
        10
    );

-- Options Q12 — évaluation globale (template 3)
INSERT INTO
    form_question_options (
        question_id,
        label,
        value,
        order_index
    )
VALUES (
        12,
        'Très bien',
        'tres_bien',
        1
    ),
    (12, 'Bien', 'bien', 2),
    (
        12,
        'Je suis mitigé(e)',
        'mitige',
        3
    ),
    (
        12,
        'Plutôt mauvais',
        'mauvais',
        4
    ),
    (
        12,
        'Très mauvais',
        'tres_mauvais',
        5
    );

-- Options Q16 — utilité pour le métier
INSERT INTO
    form_question_options (
        question_id,
        label,
        value,
        order_index
    )
VALUES (
        16,
        'Pas du tout',
        'pas_du_tout',
        1
    ),
    (16, 'Un peu', 'un_peu', 2),
    (
        16,
        'Plutôt bien',
        'plutot_bien',
        3
    ),
    (
        16,
        'Très bien',
        'tres_bien',
        4
    );

-- Options Q17 — exercices/projets
INSERT INTO
    form_question_options (
        question_id,
        label,
        value,
        order_index
    )
VALUES (
        17,
        'Trop faciles',
        'trop_faciles',
        1
    ),
    (17, 'Adaptés', 'adaptes', 2),
    (
        17,
        'Je suis mitigé(e)',
        'mitige',
        3
    ),
    (
        17,
        'Trop difficiles',
        'trop_diff',
        4
    );

-- Options Q20 — ambiance de travail
INSERT INTO
    form_question_options (
        question_id,
        label,
        value,
        order_index
    )
VALUES (
        20,
        'Très mauvaise',
        'tres_mauvaise',
        1
    ),
    (
        20,
        'Plutôt mauvaise',
        'plutot_mauvaise',
        2
    ),
    (
        20,
        'Je ne sais pas/je suis mitigé(e)',
        'mitige',
        3
    ),
    (
        20,
        'Plutôt bonne',
        'plutot_bonne',
        4
    ),
    (
        20,
        'Très bonne',
        'tres_bonne',
        5
    );

-- -------------------------------------------------------
-- SESSIONS DE TEST
-- -------------------------------------------------------
INSERT INTO
    survey_sessions (
        id,
        form_template_id,
        created_by_user_id,
        title,
        status,
        join_code
    )
VALUES (
        1,
        1,
        1,
        'Test — Questions communes',
        'open',
        'DEMO0001'
    ),
    (
        2,
        2,
        2,
        'Test — Cours de langue',
        'open',
        'LANGUE01'
    ),
    (
        3,
        3,
        3,
        'Test — UE de section',
        'open',
        'UESECT01'
    ),
    (
        4,
        1,
        1,
        'Session archivée',
        'closed',
        'ARCH2025'
    );