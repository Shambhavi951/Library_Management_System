USE LibraryDB;
GO

/* Branch master */

CREATE TABLE branches (

    branch_id INT IDENTITY(1,1)
    PRIMARY KEY,

    branch_name VARCHAR(100)
    UNIQUE
    NOT NULL,

    address_line VARCHAR(255),

    contact_number VARCHAR(30),

    branch_status VARCHAR(20)
    DEFAULT 'ACTIVE'
);

INSERT INTO branches(
branch_name,
address_line
)
VALUES
('Central Library','Main Campus'),
('Engineering Library','Engineering Block'),
('Research Library','Research Wing');

GO

/* Membership plans */

CREATE TABLE membership_plans (

    membership_plan_id INT IDENTITY(1,1)
    PRIMARY KEY,

    plan_name VARCHAR(30)
    UNIQUE
    NOT NULL,

    monthly_cost DECIMAL(10,2),

    max_active_borrows INT,

    reservation_limit INT,

    hold_duration_hours INT,

    queue_priority INT,

    cross_branch_priority CHAR(1),

    reading_list_limit INT
);

INSERT INTO membership_plans
VALUES
(
'STANDARD',
299,
3,
5,
24,
0,
'N',
1
),
(
'PREMIUM',
799,
8,
15,
72,
1,
'Y',
10
);

GO

/* Members */

CREATE TABLE members (

    member_id INT IDENTITY(1,1)
    PRIMARY KEY,

    first_name VARCHAR(50),

    last_name VARCHAR(50),

    email VARCHAR(100)
    UNIQUE,

    phone_number VARCHAR(20),

    home_branch_id INT,

    preferred_branch_id INT,

    membership_plan_id INT,

    join_date DATE
    DEFAULT GETDATE(),

    active_status CHAR(1)
    DEFAULT 'Y',

    FOREIGN KEY(home_branch_id)
    REFERENCES branches(branch_id),

    FOREIGN KEY(preferred_branch_id)
    REFERENCES branches(branch_id),

    FOREIGN KEY(membership_plan_id)
    REFERENCES membership_plans(
        membership_plan_id
    )
);

/* Accounts */

CREATE TABLE user_accounts (

    account_id INT IDENTITY(1,1)
    PRIMARY KEY,

    username VARCHAR(100)
    UNIQUE,

    email VARCHAR(100)
    UNIQUE,

    password_hash VARCHAR(255),

    password_salt VARCHAR(255),

    role_type VARCHAR(20),

    member_id INT,

    branch_id INT,

    created_date DATETIME
    DEFAULT GETDATE(),

    active_status CHAR(1)
    DEFAULT 'Y',

    FOREIGN KEY(member_id)
    REFERENCES members(member_id),

    FOREIGN KEY(branch_id)
    REFERENCES branches(branch_id)
);

/* Admin profiles */

CREATE TABLE admin_profiles (

    admin_profile_id INT IDENTITY(1,1)
    PRIMARY KEY,

    account_id INT
    UNIQUE,

    branch_id INT,

    salary_amount DECIMAL(12,2),

    hire_date DATE,

    FOREIGN KEY(account_id)
    REFERENCES user_accounts(account_id),

    FOREIGN KEY(branch_id)
    REFERENCES branches(branch_id)
);

/* Owner configuration */

CREATE TABLE owner_settings (

    setting_id INT IDENTITY(1,1)
    PRIMARY KEY,

    fine_per_day DECIMAL(10,2),

    premium_membership_cost DECIMAL(10,2),

    standard_membership_cost DECIMAL(10,2),

    standard_hold_hours INT,

    premium_hold_hours INT,

    updated_date DATETIME
    DEFAULT GETDATE()
);

/* Authors */

CREATE TABLE authors (

    author_id INT IDENTITY(1,1)
    PRIMARY KEY,

    first_name VARCHAR(50),

    last_name VARCHAR(50),

    biography VARCHAR(1000)
);

/* Subjects */

CREATE TABLE subjects (

    subject_id INT IDENTITY(1,1)
    PRIMARY KEY,

    subject_name VARCHAR(100)
    UNIQUE
);

/* Publications */

CREATE TABLE publications (

    publication_id INT IDENTITY(1,1)
    PRIMARY KEY,

    title VARCHAR(200),

    publication_year INT,

    publisher_name VARCHAR(100),

    language_name VARCHAR(50),

    publication_type VARCHAR(20),

    popularity_score INT
    DEFAULT 0,

    publication_status VARCHAR(30)
    DEFAULT 'AVAILABLE'
);

/* Books */

CREATE TABLE books (

    publication_id INT
    PRIMARY KEY,

    isbn VARCHAR(30)
    UNIQUE,

    edition_name VARCHAR(50),

    page_count INT,

    FOREIGN KEY(publication_id)
    REFERENCES publications(
        publication_id
    )
);

/* Publication authors */

CREATE TABLE publication_authors (

    publication_id INT,

    author_id INT,

    author_order INT,

    PRIMARY KEY(
        publication_id,
        author_id
    )
);

/* Publication subjects */

CREATE TABLE publication_subjects (

    publication_id INT,

    subject_id INT,

    PRIMARY KEY(
        publication_id,
        subject_id
    )
);

/* Inventory */

CREATE TABLE inventory_copies (

    copy_id INT IDENTITY(1,1)
    PRIMARY KEY,

    publication_id INT,

    branch_id INT,

    copy_number INT,

    copy_condition VARCHAR(20),

    copy_status VARCHAR(40),

    floor_number INT,

    section_code VARCHAR(20),

    shelf_number VARCHAR(20),

    rack_number VARCHAR(20),

    position_number VARCHAR(20),

    qr_identifier VARCHAR(100),

    barcode_identifier VARCHAR(100),

    acquisition_date DATE
    DEFAULT GETDATE(),

    FOREIGN KEY(publication_id)
    REFERENCES publications(
        publication_id
    ),

    FOREIGN KEY(branch_id)
    REFERENCES branches(branch_id)
);

/* Borrowing */

CREATE TABLE borrowing_records (

    borrow_id INT IDENTITY(1,1)
    PRIMARY KEY,

    copy_id INT,

    member_id INT,

    borrowed_date DATETIME
    DEFAULT GETDATE(),

    due_date DATETIME,

    returned_date DATETIME,

    borrow_status VARCHAR(30),

    fine_amount DECIMAL(10,2),

    FOREIGN KEY(copy_id)
    REFERENCES inventory_copies(copy_id),

    FOREIGN KEY(member_id)
    REFERENCES members(member_id)
);

/* Reservation queue */

CREATE TABLE reservation_queue (

    reservation_id INT IDENTITY(1,1)
    PRIMARY KEY,

    member_id INT,

    publication_id INT,

    preferred_branch_id INT,

    assigned_branch_id INT,

    queue_position INT,

    reservation_date DATETIME
    DEFAULT GETDATE(),

    hold_expiry DATETIME,

    reservation_status VARCHAR(30),

    FOREIGN KEY(member_id)
    REFERENCES members(member_id)
);

/* Holds */

CREATE TABLE book_holds (

    hold_id INT IDENTITY(1,1)
    PRIMARY KEY,

    reservation_id INT,

    copy_id INT,

    member_id INT,

    hold_created DATETIME,

    hold_expiry DATETIME,

    hold_status VARCHAR(30)
);

/* Quality checks */

CREATE TABLE quality_checks (

    quality_check_id INT IDENTITY(1,1)
    PRIMARY KEY,

    copy_id INT,

    previous_condition VARCHAR(20),

    updated_condition VARCHAR(20),

    remarks VARCHAR(500),

    inspection_date DATETIME
);

/* Transfers */

CREATE TABLE branch_transfers (

    transfer_id INT IDENTITY(1,1)
    PRIMARY KEY,

    copy_id INT,

    source_branch_id INT,

    destination_branch_id INT,

    transfer_status VARCHAR(30),

    requested_date DATETIME,

    arrival_date DATETIME,

    requested_by_member_id INT
);

/* Acquisition requests */

CREATE TABLE acquisition_requests (

    acquisition_request_id INT IDENTITY(1,1)
    PRIMARY KEY,

    member_id INT,

    requested_title VARCHAR(200),

    requested_author VARCHAR(200),

    requested_isbn VARCHAR(30),

    preferred_branch_id INT,

    priority_level VARCHAR(20),

    request_status VARCHAR(30)
);

/* Notifications */

CREATE TABLE notifications (

    notification_id INT IDENTITY(1,1)
    PRIMARY KEY,

    member_id INT,

    notification_type VARCHAR(50),

    title VARCHAR(200),

    message_body VARCHAR(1000),

    read_status CHAR(1),

    branch_id INT,

    created_date DATETIME
);

/* Reviews */

CREATE TABLE publication_reviews (

    review_id INT IDENTITY(1,1)
    PRIMARY KEY,

    publication_id INT,

    member_id INT,

    rating_value INT,

    review_text VARCHAR(1000)
);

/* Reading lists */

CREATE TABLE reading_lists (

    reading_list_id INT IDENTITY(1,1)
    PRIMARY KEY,

    member_id INT,

    list_name VARCHAR(100),

    visibility_status VARCHAR(20)
);

CREATE TABLE reading_list_items (

    item_id INT IDENTITY(1,1)
    PRIMARY KEY,

    reading_list_id INT,

    publication_id INT
);

/* Borrow history */

CREATE TABLE borrowing_history (

    history_id INT IDENTITY(1,1)
    PRIMARY KEY,

    member_id INT,

    copy_id INT,

    publication_id INT,

    borrowed_date DATETIME,

    returned_date DATETIME,

    days_kept INT,

    fine_paid DECIMAL(10,2)
);

GO
