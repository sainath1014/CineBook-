from rest_framework import permissions


class IsTheatreStaff(permissions.BasePermission):
    """
    Allows access only to authenticated staff users assigned to a theatre or platform admins.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True
        profile = getattr(request.user, 'profile', None)
        return bool(profile and profile.role in ['STAFF', 'ADMIN'])


class IsPlatformAdmin(permissions.BasePermission):
    """
    Allows access only to platform administrators.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True
        profile = getattr(request.user, 'profile', None)
        return bool(profile and profile.role == 'ADMIN')


class IsBookingOwnerOrStaff(permissions.BasePermission):
    """
    Allows access to the booking owner, staff members, or admin.
    """
    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True
        profile = getattr(request.user, 'profile', None)
        if profile and profile.role in ['STAFF', 'ADMIN']:
            return True
        return obj.user == request.user
