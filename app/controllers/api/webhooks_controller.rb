module Api
  class WebhooksController < ApplicationController
    skip_before_action :verify_authenticity_token

    def hooks
      render json: {
        hooks: gh.repos(params[:user],params[:repo]).hooks
      }
    end

    def publish_issue_event
      return render json: { message: "pong" } if request.env["HTTP_X_GITHUB_EVENT"] == "ping"

      payload = HashWithIndifferentAccess.new JSON.parse(params[:payload])
      return render json: { message: "Fail to parse message" } if payload[:issue].nil?

      repo = {
        repo: {
          owner: { login: payload[:repository][:owner][:login] },
          name: payload[:repository][:name]
        }
      }
      payload[:issue].extend(Huboard::Issues::Card).merge!(repo)

      message = HashWithIndifferentAccess.new(
        :issue => payload[:issue],
        "action_controller.params" => {},
        :current_user => payload[:sender]
      )

      case payload[:action]
      when "opened"
        Api::IssuesCreateIssueJob.perform_later message
      when "reopened"
        Api::IssuesReopenIssueJob.perform_later message
      when "closed"
        Api::IssuesCloseIssueJob.perform_later message
      end

      render json: { message: "Webhook received" }
    end

    #Putting this one on the backburner for now...
    def log_comment
      render json: { message: "Webhook received" }
    end

    def stripe
      return render json: { message: "Not Authorized" } unless params[:stripe_token] == ENV["STRIPE_WEBHOOK_TOKEN"]

      payload = Hashie::Mash.new(params)
      id = payload.data.object.customer

      if payload.type == "customer.subscription.updated" || payload.type == "customer.subscription.deleted"
        query = Queries::CouchCustomer.get_cust(id, couch)
        plan_doc = QueryHandler.exec(&query)
        return render json: { message: "Webhook received" } unless plan_doc && plan_doc.id == id

        plan_doc.trial = "expired" if payload.data.object.status != "trialing"

        customer = plan_doc.stripe.customer
        customer.subscriptions.data[0] = payload.data.object
        couch.customers.save plan_doc
      end

      render json: { message: "Webhook received" }
    end

  end
end
