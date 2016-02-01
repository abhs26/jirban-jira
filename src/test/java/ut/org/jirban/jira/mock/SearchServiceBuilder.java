/*
 * JBoss, Home of Professional Open Source.
 * Copyright 2016, Red Hat, Inc., and individual contributors
 * as indicated by the @author tags. See the copyright.txt file in the
 * distribution for a full listing of individual contributors.
 *
 * This is free software; you can redistribute it and/or modify it
 * under the terms of the GNU Lesser General Public License as
 * published by the Free Software Foundation; either version 2.1 of
 * the License, or (at your option) any later version.
 *
 * This software is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public
 * License along with this software; if not, write to the Free
 * Software Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA
 * 02110-1301 USA, or see the FSF site: http://www.fsf.org.
 */
package ut.org.jirban.jira.mock;

import static org.mockito.Matchers.any;
import static org.mockito.Matchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.util.Collections;

import com.atlassian.crowd.embedded.api.User;
import com.atlassian.jira.bc.issue.search.SearchService;
import com.atlassian.jira.issue.Issue;
import com.atlassian.jira.issue.issuetype.IssueType;
import com.atlassian.jira.issue.priority.Priority;
import com.atlassian.jira.issue.search.SearchException;
import com.atlassian.jira.issue.search.SearchResults;
import com.atlassian.jira.issue.search.managers.SearchHandlerManager;
import com.atlassian.jira.issue.status.Status;
import com.atlassian.jira.jql.builder.JqlClauseBuilder;
import com.atlassian.jira.jql.builder.JqlClauseBuilderFactory;
import com.atlassian.jira.jql.builder.JqlQueryBuilder;
import com.atlassian.jira.mock.component.MockComponentWorker;
import com.atlassian.jira.web.bean.PagerFilter;
import com.atlassian.query.Query;

/**
 * @author Kabir Khan
 */
public class SearchServiceBuilder {
    private final SearchService searchService = mock(SearchService.class);

    private IssueRegistry issueRegistry = new IssueRegistry(new UserManagerBuilder().addDefaultUsers().build());
    private String searchProject;
    private String searchStatus;

    public SearchServiceBuilder setIssueRegistry(IssueRegistry issueRegistry) {
        this.issueRegistry = issueRegistry;
        return this;
    }

    public SearchService build(MockComponentWorker mockComponentWorker) throws SearchException {
        registerMockQueryManagers(mockComponentWorker);
        when(searchService.search(any(User.class), any(Query.class), any(PagerFilter.class)))
                .then(invocation -> getSearchResults());

        return searchService;
    }

    private SearchResults getSearchResults() {
        SearchResults searchResults = mock(SearchResults.class);
        when(searchResults.getIssues()).thenReturn(issueRegistry.getIssueList(searchProject, searchStatus));

        when(searchResults.toString()).thenReturn("<SNIP>");
        return searchResults;
    }

    private void registerMockQueryManagers(MockComponentWorker mockComponentWorker) {
        mockComponentWorker.addMock(JqlClauseBuilderFactory.class, jqlQueryBuilder -> new ClauseBuilderFactory(jqlQueryBuilder).jqlClauseBuilder);
        mockComponentWorker.addMock(SearchHandlerManager.class, SearchHandlerManagerFactory.create());
    }

    private class ClauseBuilderFactory {
        final JqlQueryBuilder jqlQueryBuilder;
        final JqlClauseBuilder jqlClauseBuilder = mock(JqlClauseBuilder.class);

        ClauseBuilderFactory(JqlQueryBuilder jqlQueryBuilder) {
            this.jqlQueryBuilder = jqlQueryBuilder;
            when(jqlClauseBuilder.project(anyString())).then(invocation -> {
                searchProject = (String) invocation.getArguments()[0];
                return jqlClauseBuilder;
            });
            when(jqlClauseBuilder.status(anyString())).then(invocation -> {
                searchStatus = (String) invocation.getArguments()[0];
                return jqlClauseBuilder;
            });

        }
    }

    private static class SearchHandlerManagerFactory {
        final SearchHandlerManager shm = mock(SearchHandlerManager.class);

        SearchHandlerManagerFactory() {
            when(shm.getJqlClauseNames(anyString())).thenReturn(Collections.emptySet());
        }
        static SearchHandlerManager create() {
            return new SearchHandlerManagerFactory().shm;
        }
    }

    private static class IssueDetail {
        final Issue issue = mock(Issue.class);

        final IssueType issueType;
        final Priority priority = mock(Priority.class);
        final Status state = mock(Status.class);
        final User assignee = mock(User.class);

        public IssueDetail(String key, String issueType, String priority, String summary,
                           String state, String assignee) {
            //Do the nested mocks first
            this.issueType = IssueTypeManagerBuilder.MockIssueType.get(issueType);
            when(this.priority.getName()).thenReturn(priority);
            when(this.state.getName()).thenReturn(state);
            when(this.assignee.getName()).thenReturn(assignee);

            when(issue.getKey()).thenReturn(key);
            when(issue.getSummary()).thenReturn(summary);
            when(issue.getIssueTypeObject()).thenReturn(this.issueType);
            when(issue.getPriorityObject()).thenReturn(this.priority);
            when(issue.getStatusObject()).thenReturn(this.state);
            when(issue.getAssignee()).thenReturn(this.assignee);
        }
    }
}