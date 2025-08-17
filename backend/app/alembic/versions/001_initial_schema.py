"""initial schema

Revision ID: 001_initial_schema
Revises: 
Create Date: 2024-01-01 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = '001_initial_schema'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    op.create_table('jobs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('description', sa.String(), nullable=False),
        sa.Column('location', sa.String(), nullable=False),
        sa.Column('salary', sa.Float(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('Requirements', sa.String(), nullable=True),
        sa.Column('Conditions_and_benefits', sa.String(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_jobs_id'), 'jobs', ['id'], unique=False)

    op.create_table('applications',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('job_id', sa.Integer(), nullable=False),
        sa.Column('fio', sa.String(), nullable=False),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('phone', sa.String(), nullable=False),
        sa.Column('experience', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('status', sa.String(), nullable=True),
        sa.ForeignKeyConstraint(['job_id'], ['jobs.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_applications_id'), 'applications', ['id'], unique=False)

    op.create_table('settings',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('site_email', sa.String(), nullable=False),
        sa.Column('site_phone', sa.String(), nullable=False),
        sa.Column('site_adress', sa.String(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_settings_id'), 'settings', ['id'], unique=False)

    op.create_table('profession_media',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('job_id', sa.Integer(), nullable=True),
        sa.Column('file_name', sa.String(), nullable=False),
        sa.Column('file_type', sa.String(), nullable=False),
        sa.Column('file_data', sa.LargeBinary(), nullable=False),
        sa.Column('mime_type', sa.String(), nullable=False),
        sa.ForeignKeyConstraint(['job_id'], ['jobs.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_profession_media_id'), 'profession_media', ['id'], unique=False)

def downgrade():
    op.drop_index(op.f('ix_profession_media_id'), table_name='profession_media')
    op.drop_table('profession_media')
    op.drop_index(op.f('ix_settings_id'), table_name='settings')
    op.drop_table('settings')
    op.drop_index(op.f('ix_applications_id'), table_name='applications')
    op.drop_table('applications')
    op.drop_index(op.f('ix_jobs_id'), table_name='jobs')
    op.drop_table('jobs')
