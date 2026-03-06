; Custom NSIS script for LocalAI Insight Studio Installer
; This script cleans user data (models) during installation

!macro customInstall
  ; Delete user model data to start fresh
  ; This ensures user-added models from development are not included
  Delete "$INSTDIR\..\localai-insight-studio\*.*"
  Delete "$HOME\.localai-insight-studio\models.json"
  
  ; Also clean any stored model files in user home directory
  RMDir /r "$HOME\.localai-insight-studio"
!macroend

!macro customUnInstall
  ; Clean up user data on uninstall
  RMDir /r "$HOME\.localai-insight-studio"
  RMDir /r "$APPDATA\LocalAI Insight Studio"
!macroend
