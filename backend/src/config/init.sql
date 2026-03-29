-- ==================================================
-- IFOSUP Questionnaire MVP — Script de création BDD
-- Base : ifosup | Charset : utf8mb4
-- ==================================================

SET FOREIGN_KEY_CHECKS = 0;

-- 1. Utilisateurs (profs + admins)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'professor' COMMENT 'admin | professor',
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

-- 2. Formations (ex : Bachelier Informatique)
CREATE TABLE IF NOT EXISTS formations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

-- 3. Cours
CREATE TABLE IF NOT EXISTS courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

-- 4. Années académiques
CREATE TABLE IF NOT EXISTS academic_years (
    id INT AUTO_INCREMENT PRIMARY KEY,
    label VARCHAR(20) NOT NULL UNIQUE COMMENT '2024-2025',
    starts_on DATE NOT NULL,
    ends_on DATE NOT NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

-- 5. Table de jonction Formation ↔ Cours
CREATE TABLE IF NOT EXISTS formation_courses (
    course_id INT NOT NULL,
    formation_id INT NOT NULL,
    PRIMARY KEY (course_id, formation_id),
    CONSTRAINT fk_fc_course FOREIGN KEY (course_id) REFERENCES courses (id) ON DELETE CASCADE,
    CONSTRAINT fk_fc_formation FOREIGN KEY (formation_id) REFERENCES formations (id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

-- 6. Affectations enseignant ↔ cours ↔ année
CREATE TABLE IF NOT EXISTS teaching_assignments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    professor_user_id INT NOT NULL,
    academic_year_id INT NOT NULL,
    course_id INT NOT NULL,
    CONSTRAINT fk_ta_professor FOREIGN KEY (professor_user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_ta_academic_year FOREIGN KEY (academic_year_id) REFERENCES academic_years (id) ON DELETE CASCADE,
    CONSTRAINT fk_ta_course FOREIGN KEY (course_id) REFERENCES courses (id) ON DELETE CASCADE,
    UNIQUE KEY uq_assignment (
        professor_user_id,
        academic_year_id,
        course_id
    )
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

-- 7. Modèles de formulaires
CREATE TABLE IF NOT EXISTS form_templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    owner_user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    is_global BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_ft_owner FOREIGN KEY (owner_user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

-- 8. Questions d'un formulaire
CREATE TABLE IF NOT EXISTS form_questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    form_template_id INT NOT NULL,
    type VARCHAR(30) NOT NULL COMMENT 'text | number | single_choice | multiple_choice | scale | textarea',
    label TEXT NOT NULL,
    help_text TEXT,
    is_required BOOLEAN NOT NULL DEFAULT FALSE,
    order_index INT NOT NULL DEFAULT 0,
    config_json TEXT COMMENT 'config spécifique au type (ex: min/max pour scale)',
    CONSTRAINT fk_fq_template FOREIGN KEY (form_template_id) REFERENCES form_templates (id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

-- 9. Options pour les questions QCM / choix
CREATE TABLE IF NOT EXISTS form_question_options (
    id INT AUTO_INCREMENT PRIMARY KEY,
    question_id INT NOT NULL,
    label VARCHAR(255) NOT NULL,
    value VARCHAR(100) NOT NULL,
    order_index INT NOT NULL DEFAULT 0,
    CONSTRAINT fk_fqo_question FOREIGN KEY (question_id) REFERENCES form_questions (id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

-- 10. Sessions de sondage (= formulaire activé pour un cours)
CREATE TABLE IF NOT EXISTS survey_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    form_template_id INT NOT NULL,
    course_id INT,
    formation_id INT,
    academic_year_id INT,
    created_by_user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'draft' COMMENT 'draft | open | closed',
    join_code VARCHAR(12) NOT NULL UNIQUE,
    closes_at DATETIME,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ss_template FOREIGN KEY (form_template_id) REFERENCES form_templates (id) ON DELETE RESTRICT,
    CONSTRAINT fk_ss_course FOREIGN KEY (course_id) REFERENCES courses (id) ON DELETE SET NULL,
    CONSTRAINT fk_ss_formation FOREIGN KEY (formation_id) REFERENCES formations (id) ON DELETE SET NULL,
    CONSTRAINT fk_ss_academic_year FOREIGN KEY (academic_year_id) REFERENCES academic_years (id) ON DELETE SET NULL,
    CONSTRAINT fk_ss_created_by FOREIGN KEY (created_by_user_id) REFERENCES users (id) ON DELETE RESTRICT
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

-- 11. Réponses anonymes (une ligne = un étudiant a soumis)
CREATE TABLE IF NOT EXISTS survey_responses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    survey_session_id INT NOT NULL,
    submitted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_sr_session FOREIGN KEY (survey_session_id) REFERENCES survey_sessions (id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

-- 12. Détail de chaque réponse (valeur par question)
CREATE TABLE IF NOT EXISTS survey_answers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    response_id INT NOT NULL,
    question_id INT NOT NULL,
    value_text TEXT,
    value_number INT,
    value_option_id INT,
    CONSTRAINT fk_sa_response FOREIGN KEY (response_id) REFERENCES survey_responses (id) ON DELETE CASCADE,
    CONSTRAINT fk_sa_question FOREIGN KEY (question_id) REFERENCES form_questions (id) ON DELETE CASCADE,
    CONSTRAINT fk_sa_option FOREIGN KEY (value_option_id) REFERENCES form_question_options (id) ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;

-- ==================================================
-- Seed : admin par défaut (mot de passe à changer !)
-- Hash bcrypt de "admin1234" (rounds=10)
-- ==================================================
INSERT IGNORE INTO
    users (
        email,
        password_hash,
        role,
        first_name,
        last_name
    )
VALUES (
        'admin@ifosup.be',
        '$2b$10$F5abgfCq0fyiwH9bqkAad.WC5nsoa1qEoG9h263XCLHZGz9Ch6rT2',
        'admin',
        'Admin',
        'IFOSUP'
    );