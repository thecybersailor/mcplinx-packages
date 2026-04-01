import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import ConnectorIndexPage from '../pages/ConnectorIndexPage.vue'

describe('ConnectorIndexPage', () => {
  const cards = [
    {
      id: 'connections',
      title: 'Connections',
      description: 'Manage team connections.',
      actionLabel: 'Open Connections',
      to: { name: 'connections-index' },
      stats: [{ label: 'Items', value: 2 }],
    },
    {
      id: 'connectors',
      title: 'Connectors',
      description: 'Manage connector packages.',
      actionLabel: 'Open Connectors',
      to: { name: 'packages-index' },
    },
  ]

  it('renders host supplied title, description, cards, and cli commands', () => {
    const wrapper = mount(ConnectorIndexPage, {
      props: {
        title: 'Third-Party Integrations',
        description: 'Host supplied homepage copy.',
        cards,
        cliHintTitle: 'CLI Hint',
        cliHintDescription: 'Use the CLI for package operations.',
        cliCommands: ['syntool login --login-url <login-url>', 'syntool build', 'syntool publish'],
      },
      global: {
        stubs: {
          RouterLink: {
            props: ['to'],
            template: '<a :data-to="JSON.stringify(to)"><slot /></a>',
          },
        },
      },
    })

    expect(wrapper.text()).toContain('Third-Party Integrations')
    expect(wrapper.text()).toContain('Host supplied homepage copy.')
    expect(wrapper.text()).toContain('Connections')
    expect(wrapper.text()).toContain('Manage team connections.')
    expect(wrapper.text()).toContain('Open Connections')
    expect(wrapper.text()).toContain('CLI Hint')
    expect(wrapper.text()).toContain('Use the CLI for package operations.')
    expect(wrapper.text()).toContain('syntool login --login-url <login-url>')
    expect(wrapper.text()).toContain('syntool build')
    expect(wrapper.text()).toContain('syntool publish')
  })

  it('supports slot override for the header region', () => {
    const wrapper = mount(ConnectorIndexPage, {
      props: {
        title: 'Third-Party Integrations',
        description: 'Host supplied homepage copy.',
        cards,
      },
      slots: {
        header: '<div data-test-id="custom-header">Custom Header</div>',
      },
      global: {
        stubs: {
          RouterLink: {
            props: ['to'],
            template: '<a :data-to="JSON.stringify(to)"><slot /></a>',
          },
        },
      },
    })

    expect(wrapper.find('[data-test-id="custom-header"]').exists()).toBe(true)
    expect(wrapper.text()).not.toContain('Third-Party Integrations')
  })

  it('uses asChild link composition for card actions', () => {
    const wrapper = mount(ConnectorIndexPage, {
      props: {
        title: 'Third-Party Integrations',
        cards,
      },
      global: {
        stubs: {
          RouterLink: {
            props: ['to'],
            template: '<a data-test-id="router-link" :data-to="JSON.stringify(to)"><slot /></a>',
          },
        },
      },
    })

    const action = wrapper.get('[data-test-id="connector-index.card.connections.action"]')
    expect(action.element.tagName).toBe('A')
    expect(action.attributes('data-to')).toContain('connections-index')
    expect(wrapper.find('button [data-test-id="connector-index.card.connections.action"]').exists()).toBe(false)
  })
})
