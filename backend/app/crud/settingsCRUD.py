from models.model import Settings
from crud.baseCrud import BaseCRUD
from sqlalchemy.orm import Session
from schemas.settingsSchema import SettingSchema


class SettingCRUD(BaseCRUD):
    def __init__(self):
        super().__init__(Settings)

    def update_settings(self, db: Session, id, obj_data: SettingSchema):
        return super().update(db, id, obj_data)
    

settingscrud = SettingCRUD()