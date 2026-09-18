<template>
    <div class="login-view">
        <h1>loading...</h1>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  login,
  userInfoFromApi
} from '@/api/auth'
import { notifyLoginSuccess } from '@/utils/loginNotify'
import { useAuthStore } from '@/stores/auth'


const loading = ref(false)
const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const { t, tm, locale } = useI18n()

const persistLoginResponse = async (response: any, skipRedirect = false) => {
  // Backend renamed `tenant` to `active_tenant` and added `memberships`
  // when tenant-level RBAC landed (issue #1303). The two are otherwise
  // identical — `active_tenant` is the tenant whose ID is encoded in the
  // JWT, defaulting to the user's home tenant on a fresh login.
  const activeTenant = response.active_tenant || response.tenant
  if (response.user && response.token) {
    // user.tenant_id must be the user's HOME tenant (the immutable row
    // on the users table); useHomeTenant() and the home-badge logic both
    // assume so. The ACTIVE tenant (which can differ from home when the
    // server honoured a remembered last-active-tenant preference) is
    // expressed separately via setSelectedTenant below.
    const homeTenantIdRaw = response.user.tenant_id ?? activeTenant?.id ?? ''
    authStore.setUser(userInfoFromApi(response.user, homeTenantIdRaw))
    authStore.setToken(response.token)
    if (response.refresh_token) {
      authStore.setRefreshToken(response.refresh_token)
    }
    if (activeTenant) {
      authStore.setTenant({
        id: String(activeTenant.id) || '',
        name: activeTenant.name || '',
        owner_id: response.user.id || '',
        created_at: activeTenant.created_at || new Date().toISOString(),
        updated_at: activeTenant.updated_at || new Date().toISOString()
      })
    } else {
      authStore.setTenant(null)
    }
    if (Array.isArray(response.memberships)) {
      authStore.setMemberships(response.memberships)
    }
    // If the backend dropped us into a non-home tenant (honoured a
    // remembered "last active tenant" preference), set the override so
    // subsequent requests carry X-Tenant-ID and the UI stays consistent.
    // Otherwise clear any stale override left in localStorage by a
    // previous session for a different account.
    const activeIdNum = Number(activeTenant?.id)
    const homeIdNum = Number(homeTenantIdRaw)
    if (Number.isFinite(activeIdNum) && Number.isFinite(homeIdNum) && activeIdNum !== homeIdNum) {
      authStore.setSelectedTenant(activeIdNum, activeTenant?.name || null)
    } else {
      authStore.setSelectedTenant(null, null)
    }
  }

  // Pull runtime capabilities (including whether ordinary users may create
  // workspaces) before entering the main UI so create actions never flash
  // briefly when the deployment is invitation-only.
  await authStore.refreshFromAuthMe()
  await nextTick()
  if (skipRedirect) return
  router.replace(authStore.hasValidTenant ? '/platform/knowledge-bases' : '/onboarding/workspace')
}


// Handle login
const handleLogin = async () => {
  try {

    loading.value = true

    const response = await login({
      email:'zhuwl@sanyou.com',
      password: 'sanyou123',
    })

    console.log('登录成功:', response)

    if (response.success) {
    //   if (inviteToken.value) {
    //     // 从邀请链接登录：持久化会话后兑换 token 并进入对应空间。
    //     await persistLoginResponse(response, true)
    //     await acceptAndEnter(inviteToken.value)
    //     return
    //   }
      await persistLoginResponse(response)
    //   notifyLoginSuccess(response, t, tm, formatRole, roleIcon)
    } else {
    //   MessagePlugin.error(response.message || t('auth.loginError'))
    }
  } catch (error: any) {
    console.error('登录错误:', error)
  } finally {
    loading.value = false
  }
}


onMounted(() => {
    debugger
    console.log('Login mounted')
    handleLogin()
})
</script>

<style lang="css" scoped>
.login-view {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100%;
}
</style>